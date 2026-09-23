import { auth } from "@/lib/auth";
import {
  calculateOrderTotals,
  calculateUnitPrice,
  toNumber,
} from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { orderNumber, formatMoney } from "@/lib/utils";
import { orderConfirmationHtml, sendEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
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

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();
  const data = parsed.data;

  // Server-trusted price recalculation
  const pricedLines: {
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    productId?: string;
    variantId?: string;
    sku?: string;
    imageUrl?: string;
    configJson?: object;
  }[] = [];

  for (const line of data.lines) {
    if (line.kind === "configured" && line.config) {
      const [shape, fabric, size, lining, fitting] = await Promise.all([
        prisma.shape.findUnique({ where: { key: line.config.shapeKey } }),
        prisma.fabric.findUnique({ where: { slug: line.config.fabricSlug } }),
        prisma.size.findUnique({ where: { slug: line.config.sizeSlug } }),
        prisma.lining.findUnique({ where: { slug: line.config.liningSlug } }),
        prisma.fitting.findUnique({ where: { slug: line.config.fittingSlug } }),
      ]);
      if (!shape || !fabric || !size || !lining || !fitting) {
        return NextResponse.json({ error: "Invalid shade configuration" }, { status: 400 });
      }
      const unitPrice = calculateUnitPrice({
        basePrice: shape.basePrice,
        fabricMod: fabric.priceMod,
        sizeMod: size.priceMod,
        liningMod: lining.priceMod,
        fittingMod: fitting.priceMod,
      });
      const configJson = {
        shapeKey: shape.key,
        shapeName: shape.name,
        fabricSlug: fabric.slug,
        fabricName: fabric.name,
        sizeSlug: size.slug,
        sizeName: size.name,
        liningSlug: lining.slug,
        liningName: lining.name,
        fittingSlug: fitting.slug,
        fittingName: fitting.name,
        unitPrice,
      };
      pricedLines.push({
        title: `${shape.name} shade · ${fabric.name}`,
        quantity: line.quantity,
        unitPrice,
        lineTotal: unitPrice * line.quantity,
        imageUrl: shape.imageUrl || undefined,
        configJson,
      });
    } else if (line.productId) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
        include: { images: { take: 1 }, variants: true },
      });
      if (!product || !product.published) {
        return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
      }
      const variant = line.variantId
        ? product.variants.find((v) => v.id === line.variantId)
        : product.variants[0];
      const unitPrice = variant?.priceOverride
        ? toNumber(variant.priceOverride)
        : toNumber(product.basePrice);
      pricedLines.push({
        title: product.title,
        quantity: line.quantity,
        unitPrice,
        lineTotal: unitPrice * line.quantity,
        productId: product.id,
        variantId: variant?.id,
        sku: variant?.sku,
        imageUrl: product.images[0]?.url,
      });
    } else {
      return NextResponse.json({ error: "Invalid line item" }, { status: 400 });
    }
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
    : await prisma.shippingMethod.findFirst({ where: { active: true }, orderBy: { sortOrder: "asc" } });

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
      : null,
  });

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
          configJson: l.configJson,
          imageUrl: l.imageUrl,
        })),
      },
      events: {
        create: { type: "created", message: "Order created" },
      },
    },
    include: { items: true },
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
    meta: { orderNumber: number, total: totals.total },
  });

  // Prefer Shopify hosted checkout when Storefront API is configured (brief SoT).
  const { createShopifyCheckout, isShopifyConfigured, variantGid } = await import(
    "@/lib/shopify"
  );
  if (isShopifyConfigured()) {
    const shopifyLines = [];
    for (const l of pricedLines) {
      if (!l.variantId) continue;
      const variant = await prisma.productVariant.findUnique({
        where: { id: l.variantId },
      });
      const shopifyId = variant?.shopifyVariantId;
      if (!shopifyId) {
        return NextResponse.json(
          {
            error:
              "Checkout blocked: a line item is missing Shopify variant mapping. Provide Storefront/Admin sync.",
            orderNumber: order.orderNumber,
          },
          { status: 409 }
        );
      }
      shopifyLines.push({
        merchandiseId: variantGid(shopifyId),
        quantity: l.quantity,
        attributes: l.configJson
          ? Object.entries(l.configJson as Record<string, string>).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          : undefined,
      });
    }
    if (!shopifyLines.length) {
      return NextResponse.json(
        {
          error:
            "Shopify checkout requires product variants with shopifyVariantId. Configurator-only lines need Shopify custom products.",
          orderNumber: order.orderNumber,
        },
        { status: 409 }
      );
    }
    try {
      const cart = await createShopifyCheckout(shopifyLines);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "AWAITING_PAYMENT",
          paymentStatus: "PENDING",
          events: {
            create: {
              type: "shopify_checkout",
              message: `Redirecting to Shopify cart ${cart.id}`,
            },
          },
        },
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
          orderNumber: order.orderNumber,
        },
        { status: 502 }
      );
    }
  }

  // Legacy Stripe path only when explicitly configured (not the brief SoT).
  if (isStripeConfigured()) {
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
          product_data: {
            name: item.title,
            metadata: item.configJson
              ? { config: JSON.stringify(item.configJson).slice(0, 450) }
              : undefined,
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(toNumber(order.shippingTotal) * 100),
              currency: "gbp",
            },
            display_name: shippingMethod?.name || "Shipping",
          },
        },
      ],
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

  // Do not fake a paid order — surface the credential blocker clearly.
  return NextResponse.json(
    {
      error:
        "Checkout is not live: set SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN for Shopify hosted checkout (preferred), or Stripe keys for interim card checkout.",
      orderId: order.id,
      orderNumber: order.orderNumber,
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
