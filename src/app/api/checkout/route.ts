import { auth } from "@/lib/auth";
import { calculateOrderTotals, toNumber } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { orderNumber } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import {
  createShopifyCheckout,
  isShopifyConfigured,
  variantGid,
} from "@/lib/shopify";
import { NextResponse } from "next/server";
import { z } from "zod";

const lineSchema = z.object({
  kind: z.enum(["product", "configured"]),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(20),
  config: z
    .object({
      shapeKey: z.string(),
      fabricSlug: z.string(),
      sizeSlug: z.string(),
      liningSlug: z.string(),
      fittingSlug: z.string(),
    })
    .optional(),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  lines: z.array(lineSchema).min(1),
  couponCode: z.string().optional(),
  shippingMethodId: z.string().optional(),
  shipping: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    county: z.string().optional(),
    postcode: z.string().min(3),
    country: z.string().default("GB"),
    phone: z.string().optional(),
  }),
});

type PricedLine = {
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productId?: string;
  variantId?: string;
  sku?: string;
  imageUrl?: string;
  configJson?: object;
  shopifyVariantId?: string;
};

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await auth();
  const data = parsed.data;
  const pricedLines: PricedLine[] = [];

  for (const line of data.lines) {
    if (line.kind === "configured" && line.config) {
      // Studio configurator lines are not Shopify Storefront merchandise.
      return NextResponse.json(
        {
          error:
            "Studio-configured shades are not purchasable until they map to Shopify variants. Choose a catalog product variant instead.",
          mode: "blocked",
          blockers: ["Shopify variant mapping for configurator lines"],
        },
        { status: 409 }
      );
    }

    if (!line.productId) {
      return NextResponse.json({ error: "Invalid line item" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      include: { images: { take: 1 }, variants: true },
    });
    if (!product || !product.published) {
      return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
    }

    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId && v.active)
      : product.variants.find((v) => v.active && v.shopifyVariantId) ||
        product.variants.find((v) => v.active);

    if (!variant) {
      return NextResponse.json(
        { error: "No purchasable variant available for this product", mode: "blocked" },
        { status: 409 }
      );
    }

    if (!variant.shopifyVariantId) {
      return NextResponse.json(
        {
          error:
            "Selected option is missing a Shopify variant ID and cannot be purchased.",
          mode: "blocked",
          blockers: ["shopifyVariantId on ProductVariant"],
        },
        { status: 409 }
      );
    }

    const unitPrice = variant.priceOverride
      ? toNumber(variant.priceOverride)
      : toNumber(product.basePrice);

    pricedLines.push({
      title: `${product.title}${variant.title && variant.title !== "Default Title" ? ` · ${variant.title}` : ""}`,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      imageUrl: product.images[0]?.url,
      shopifyVariantId: variant.shopifyVariantId,
    });
  }

  // Gate payment providers BEFORE creating an order — blocked responses must not expose order numbers.
  const shopifyReady = isShopifyConfigured();
  const stripeReady = isStripeConfigured();
  if (!shopifyReady && !stripeReady) {
    return NextResponse.json(
      {
        error:
          "Checkout is not live. Set SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN for Shopify hosted checkout.",
        mode: "blocked",
        blockers: [
          "SHOPIFY_STORE_DOMAIN",
          "SHOPIFY_STOREFRONT_TOKEN",
          "Verified shipping rates in Shopify",
        ],
      },
      { status: 503 }
    );
  }

  let coupon = null;
  if (data.couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }
    if (coupon.endsAt && coupon.endsAt < new Date()) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon fully redeemed" }, { status: 400 });
    }
  }

  const shippingMethod = data.shippingMethodId
    ? await prisma.shippingMethod.findUnique({ where: { id: data.shippingMethodId } })
    : await prisma.shippingMethod.findFirst({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      });

  const totals = calculateOrderTotals({
    lines: pricedLines.map((l) => ({
      basePrice: l.unitPrice,
      quantity: l.quantity,
    })),
    coupon: coupon
      ? { type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal }
      : null,
    shipping: shippingMethod
      ? {
          calcType: shippingMethod.calcType,
          price: shippingMethod.price,
          freeAbove: shippingMethod.freeAbove,
        }
      : { calcType: "FLAT" as const, price: 0, freeAbove: null },
  });

  // Shopify path (preferred SoT)
  if (shopifyReady) {
    try {
      const cart = await createShopifyCheckout(
        pricedLines.map((l) => ({
          merchandiseId: variantGid(l.shopifyVariantId!),
          quantity: l.quantity,
        }))
      );

      const number = orderNumber();
      const order = await prisma.order.create({
        data: {
          orderNumber: number,
          userId: session?.user?.id,
          email: data.email.toLowerCase(),
          status: "AWAITING_PAYMENT",
          paymentStatus: "PENDING",
          subtotal: totals.subtotal,
          shippingTotal: totals.shippingTotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          couponCode: coupon?.code,
          shippingMethodId: shippingMethod?.id,
          shippingName: data.shipping.fullName,
          shippingLine1: data.shipping.line1,
          shippingLine2: data.shipping.line2,
          shippingCity: data.shipping.city,
          shippingCounty: data.shipping.county,
          shippingPostcode: data.shipping.postcode,
          shippingCountry: data.shipping.country,
          shippingPhone: data.shipping.phone,
          items: {
            create: pricedLines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              title: l.title,
              sku: l.sku,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              imageUrl: l.imageUrl,
            })),
          },
          events: {
            create: {
              type: "shopify_checkout",
              message: `Shopify cart ${cart.id}`,
            },
          },
        },
      });

      if (coupon) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await prisma.couponRedemption.create({
          data: {
            couponId: coupon.id,
            orderId: order.id,
            userId: session?.user?.id,
          },
        });
      }

      await writeAuditLog({
        userId: session?.user?.id,
        action: "order.created",
        entity: "Order",
        entityId: order.id,
        ip,
        meta: { orderNumber: number, mode: "shopify" },
      });

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        url: cart.checkoutUrl,
        mode: "shopify",
      });
    } catch (e) {
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : "Shopify checkout failed",
          mode: "blocked",
        },
        { status: 502 }
      );
    }
  }

  // Legacy Stripe only when Shopify is not configured but Stripe is.
  if (stripeReady) {
    const number = orderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        userId: session?.user?.id,
        email: data.email.toLowerCase(),
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        subtotal: totals.subtotal,
        shippingTotal: totals.shippingTotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        couponCode: coupon?.code,
        shippingMethodId: shippingMethod?.id,
        shippingName: data.shipping.fullName,
        shippingLine1: data.shipping.line1,
        shippingLine2: data.shipping.line2,
        shippingCity: data.shipping.city,
        shippingCounty: data.shipping.county,
        shippingPostcode: data.shipping.postcode,
        shippingCountry: data.shipping.country,
        shippingPhone: data.shipping.phone,
        items: {
          create: pricedLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            sku: l.sku,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            imageUrl: l.imageUrl,
          })),
        },
        events: { create: { type: "created", message: "Order created (Stripe legacy)" } },
      },
      include: { items: true },
    });

    const stripe = getStripe()!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(toNumber(item.unitPrice) * 100),
          product_data: { name: item.title },
        },
      })),
      success_url: `${siteUrl}/order/${order.orderNumber}?success=1`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      url: checkoutSession.url,
      mode: "stripe",
    });
  }

  return NextResponse.json(
    {
      error: "Checkout is not live.",
      mode: "blocked",
      blockers: ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_STOREFRONT_TOKEN"],
    },
    { status: 503 }
  );
}
