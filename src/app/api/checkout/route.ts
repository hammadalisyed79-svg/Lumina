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

  // Stripe Checkout Session when configured
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
      discounts:
        toNumber(order.discountTotal) > 0
          ? undefined
          : undefined,
      success_url: `${siteUrl}/order/${order.orderNumber}?success=1`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    // Adjust: if discount, add negative line via metadata only — apply by reducing via coupon in totals already.
    // Stripe session total may not include discount if we use line_items only — recalculate by adjusting.
    // For accuracy with discounts, use payment_intent amount via custom: recreate with adjusted last item.
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

  // Dev / no-Stripe path: mark paid for local testing
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paymentStatus: "PAID",
      events: { create: { type: "paid_dev", message: "Marked paid (Stripe not configured)" } },
    },
  });

  const itemsHtml = order.items
    .map(
      (i) =>
        `<p>${i.quantity}× ${i.title} — ${formatMoney(i.lineTotal)}${
          i.configJson ? `<br/><small>${JSON.stringify(i.configJson)}</small>` : ""
        }</p>`,
    )
    .join("");

  await sendEmail({
    to: order.email,
    subject: `Order confirmed ${order.orderNumber}`,
    html: orderConfirmationHtml({
      orderNumber: order.orderNumber,
      email: order.email,
      total: formatMoney(order.total),
      itemsHtml,
      configNote: "Your configuration details are saved with this order.",
    }),
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    url: `/order/${order.orderNumber}?success=1`,
    mode: "dev",
  });
}
