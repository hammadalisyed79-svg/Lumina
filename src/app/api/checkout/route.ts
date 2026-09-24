import { auth } from "@/lib/auth";
import { calculateOrderTotals, applyCoupon } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { nextOrderNumber } from "@/lib/orders/numbering";
import { validateCartLines, type CartValidateInput } from "@/lib/cart/validate";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

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
      unitPrice: z.number().optional(),
      shapeName: z.string().optional(),
      fabricName: z.string().optional(),
      sizeName: z.string().optional(),
      liningName: z.string().optional(),
      fittingName: z.string().optional(),
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
  configJson?: Prisma.InputJsonValue;
};

function siteBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    .trim()
    .replace(/^["']|["']$/g, "");
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Checkout is not live. Add Stripe keys in Vercel env (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET) and redeploy.",
        mode: "blocked",
        blockers: [
          "STRIPE_SECRET_KEY",
          "STRIPE_WEBHOOK_SECRET",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        ],
      },
      { status: 503 }
    );
  }

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

  const validateInputs: CartValidateInput[] = data.lines.map((line) => {
    if (line.kind === "configured" && line.config) {
      return {
        kind: "configured" as const,
        quantity: line.quantity,
        config: {
          shapeKey: line.config.shapeKey,
          sizeSlug: line.config.sizeSlug,
          fabricSlug: line.config.fabricSlug,
          liningSlug: line.config.liningSlug,
          fittingSlug: line.config.fittingSlug,
          personalisation: undefined,
          unitPrice: line.config.unitPrice,
        },
      };
    }
    return {
      kind: "product" as const,
      quantity: line.quantity,
      productId: line.productId!,
      variantId: line.variantId,
    };
  });

  const validated = await validateCartLines(validateInputs);
  if (!validated.ok) {
    return NextResponse.json(
      {
        error: "One or more bag items can no longer be ordered",
        details: validated.lines.filter((l) => !l.ok),
      },
      { status: 409 }
    );
  }

  const pricedLines: PricedLine[] = (
    validated.lines as Extract<(typeof validated.lines)[number], { ok: true }>[]
  ).map((l) => {
    if (l.kind === "configured") {
      return {
        title: l.title,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        imageUrl: l.imageUrl,
        configJson: l.snapshot as unknown as Prisma.InputJsonValue,
      };
    }
    return {
      title: l.title,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      productId: l.productId,
      variantId: l.variantId,
      sku: l.sku,
      imageUrl: l.imageUrl,
      configJson: l.snapshot as unknown as Prisma.InputJsonValue,
    };
  });

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

  if (!data.shippingMethodId) {
    return NextResponse.json(
      { error: "Select a shipping method to continue" },
      { status: 400 }
    );
  }

  const shippingMethod = await prisma.shippingMethod.findFirst({
    where: { id: data.shippingMethodId, active: true },
  });
  if (!shippingMethod) {
    return NextResponse.json(
      { error: "Shipping method unavailable. Refresh and try again." },
      { status: 400 }
    );
  }

  const linesForTotals = pricedLines.map((l) => ({
    basePrice: l.unitPrice,
    quantity: l.quantity,
  }));
  const subtotalPreview = linesForTotals.reduce(
    (s, l) => s + l.basePrice * l.quantity,
    0
  );
  if (coupon) {
    const check = applyCoupon(subtotalPreview, {
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
    });
    if (!check.valid) {
      return NextResponse.json(
        { error: check.reason || "Coupon not applicable to this order" },
        { status: 400 }
      );
    }
  }

  const totals = calculateOrderTotals({
    lines: linesForTotals,
    coupon: coupon
      ? { type: coupon.type, value: coupon.value, minSubtotal: coupon.minSubtotal }
      : null,
    shipping: {
      calcType: shippingMethod.calcType,
      price: shippingMethod.price,
      freeAbove: shippingMethod.freeAbove,
    },
  });

  const stripe = getStripe()!;
  const number = await nextOrderNumber();
  const base = siteBaseUrl();

  try {
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
            configJson: l.configJson,
          })),
        },
        events: {
          create: {
            type: "stripe_checkout",
            message: "Stripe Checkout session creating — awaiting payment",
          },
        },
      },
    });

    const lineItems = pricedLines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(l.unitPrice * 100),
        product_data: {
          name: l.title.slice(0, 120),
          ...(l.imageUrl?.startsWith("http")
            ? { images: [l.imageUrl] }
            : l.imageUrl
              ? { images: [`${base}${l.imageUrl}`] }
              : {}),
        },
      },
    }));

    if (totals.shippingTotal > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(totals.shippingTotal * 100),
          product_data: {
            name: shippingMethod?.name || "Shipping",
          },
        },
      });
    }

    if (totals.discountTotal > 0) {
      // Represent discount as a negative adjustment is not supported on Checkout line_items;
      // coupons are applied in our totals — pass amount via metadata and adjust with Stripe coupons later.
      // For now, charge the discounted total by scaling is complex; create a single consolidated charge if discount.
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email.toLowerCase(),
      line_items:
        totals.discountTotal > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "gbp",
                  unit_amount: Math.round(totals.total * 100),
                  product_data: {
                    name: `Lumina Hub order ${number}`,
                    description: pricedLines.map((l) => `${l.quantity}× ${l.title}`).join("; ").slice(0, 400),
                  },
                },
              },
            ]
          : lineItems,
      success_url: `${base}/order/${number}?success=1`,
      cancel_url: `${base}/checkout?cancelled=1`,
      metadata: {
        orderId: order.id,
        orderNumber: number,
      },
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: checkoutSession.id,
        events: {
          create: {
            type: "stripe_checkout",
            message: `Stripe session ${checkoutSession.id} created`,
          },
        },
      },
    });

    // Coupon redemption runs on payment webhook — do not burn uses on session create.

    await writeAuditLog({
      userId: session?.user?.id,
      action: "order.created",
      entity: "Order",
      entityId: order.id,
      ip,
      meta: { orderNumber: number, mode: "stripe", paymentStatus: "PENDING" },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe session missing URL", mode: "blocked" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      url: checkoutSession.url,
      mode: "stripe",
      paymentStatus: order.paymentStatus,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Stripe checkout failed",
        mode: "blocked",
      },
      { status: 502 }
    );
  }
}
