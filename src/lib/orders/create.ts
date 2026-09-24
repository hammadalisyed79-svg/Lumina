import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  applyCoupon,
  calculateOrderTotals,
  roundMoney,
} from "@/lib/pricing";
import {
  validateCartLines,
  type CartValidateInput,
  type ValidatedCartLine,
} from "@/lib/cart/validate";
import { nextOrderNumber } from "@/lib/orders/numbering";
import { emitOrderEmailEvent } from "@/lib/orders/emails";

export type CreateOrderSource = "checkout" | "test" | "admin";

export type CreateOrderInput = {
  email: string;
  userId?: string | null;
  lines: CartValidateInput[];
  couponCode?: string;
  shippingMethodId?: string | null;
  shipping?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    county?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  notes?: string;
  source: CreateOrderSource;
  /**
   * When true, order is created without requiring payment success.
   * paymentStatus stays UNPAID / PENDING — never fake PAID.
   */
  paymentIndependent?: boolean;
  /** Override initial statuses (defaults depend on source). */
  status?: "PENDING" | "AWAITING_PAYMENT";
  paymentStatus?: "UNPAID" | "PENDING";
  productionStatus?: "NONE" | "QUEUED";
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      subtotal: number;
      shippingTotal: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
      lines: Extract<ValidatedCartLine, { ok: true }>[];
    }
  | {
      ok: false;
      error: string;
      status: number;
      details?: unknown;
    };

export async function createOrderFromCart(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.lines.length) {
    return { ok: false, error: "Cart is empty", status: 400 };
  }

  const validated = await validateCartLines(input.lines);
  if (!validated.ok) {
    return {
      ok: false,
      error: "One or more bag items can no longer be ordered",
      status: 409,
      details: {
        lines: validated.lines.filter((l) => !l.ok),
      },
    };
  }

  const pricedLines = validated.lines as Extract<ValidatedCartLine, { ok: true }>[];

  let coupon = null;
  if (input.couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: input.couponCode.toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      return { ok: false, error: "Invalid coupon", status: 400 };
    }
    if (coupon.endsAt && coupon.endsAt < new Date()) {
      return { ok: false, error: "Coupon expired", status: 400 };
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return { ok: false, error: "Coupon fully redeemed", status: 400 };
    }
  }

  let shippingMethod = null;
  if (input.shippingMethodId) {
    shippingMethod = await prisma.shippingMethod.findFirst({
      where: { id: input.shippingMethodId, active: true },
    });
    if (!shippingMethod) {
      return { ok: false, error: "Shipping method unavailable", status: 400 };
    }
  }

  const linesForTotals = pricedLines.map((l) => ({
    basePrice: l.unitPrice,
    quantity: l.quantity,
  }));

  if (coupon) {
    const check = applyCoupon(
      linesForTotals.reduce((s, l) => s + l.basePrice * l.quantity, 0),
      {
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
      }
    );
    if (!check.valid) {
      return { ok: false, error: check.reason || "Coupon not applicable", status: 400 };
    }
  }

  const totals = calculateOrderTotals({
    lines: linesForTotals,
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

  const orderNumber = await nextOrderNumber();
  const paymentIndependent = input.paymentIndependent ?? input.source === "test";

  const status = input.status ?? (paymentIndependent ? "PENDING" : "AWAITING_PAYMENT");
  const paymentStatus =
    input.paymentStatus ?? (paymentIndependent ? "UNPAID" : "PENDING");
  const productionStatus = input.productionStatus ?? "NONE";

  const ship = input.shipping || {};

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: input.userId ?? undefined,
      email: input.email.toLowerCase(),
      status,
      paymentStatus,
      productionStatus,
      subtotal: totals.subtotal,
      shippingTotal: totals.shippingTotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      couponCode: coupon?.code,
      shippingMethodId: shippingMethod?.id,
      shippingName: ship.fullName,
      shippingLine1: ship.line1,
      shippingLine2: ship.line2,
      shippingCity: ship.city,
      shippingCounty: ship.county,
      shippingPostcode: ship.postcode,
      shippingCountry: ship.country || "GB",
      shippingPhone: ship.phone,
      notes: input.notes,
      items: {
        create: pricedLines.map((l) => {
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
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            sku: l.sku,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
            imageUrl: l.imageUrl,
            configJson: l.snapshot as unknown as Prisma.InputJsonValue,
          };
        }),
      },
      events: {
        create: {
          type: "order_created",
          message:
            input.source === "test"
              ? "TEST ORDER created (payment independent — unpaid)"
              : input.source === "admin"
                ? "Order created by admin"
                : "Order created — awaiting payment",
          meta: {
            source: input.source,
            paymentIndependent,
            lineCount: pricedLines.length,
          },
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
        userId: input.userId ?? undefined,
      },
    }).catch(() => {
      /* redemption table may require user — ignore if fails */
    });
  }

  await emitOrderEmailEvent({
    type: "order_created",
    orderId: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    meta: { source: input.source, total: roundMoney(totals.total) },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    subtotal: totals.subtotal,
    shippingTotal: totals.shippingTotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    lines: pricedLines,
  };
}
