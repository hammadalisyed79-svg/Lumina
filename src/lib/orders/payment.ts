import { prisma } from "@/lib/db";
import type { PaymentStatus, OrderStatus, Prisma } from "@prisma/client";

/**
 * Mark an order paid exactly once. Concurrent/repeat calls are safe:
 * updateMany only matches non-PAID rows, so a second confirmation is a no-op.
 */
export async function markOrderPaidOnce(args: {
  orderId?: string;
  orderNumber?: string;
  shopifyOrderId?: string;
  stripePaymentIntent?: string;
  eventMessage: string;
  meta?: Prisma.InputJsonValue;
}) {
  const where: Prisma.OrderWhereInput = {
    paymentStatus: { not: "PAID" },
  };
  if (args.orderId) where.id = args.orderId;
  else if (args.orderNumber) where.orderNumber = args.orderNumber;
  else throw new Error("orderId or orderNumber required");

  const result = await prisma.order.updateMany({
    where,
    data: {
      status: "PAID" satisfies OrderStatus,
      paymentStatus: "PAID" satisfies PaymentStatus,
      ...(args.shopifyOrderId ? { shopifyOrderId: args.shopifyOrderId } : {}),
      ...(args.stripePaymentIntent
        ? { stripePaymentIntent: args.stripePaymentIntent }
        : {}),
    },
  });

  if (result.count === 1) {
    const order = await prisma.order.findFirst({
      where: args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber },
    });
    if (order) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "paid",
          message: args.eventMessage,
          meta: args.meta ?? undefined,
        },
      });
    }
    return { updated: true as const, orderId: order?.id };
  }

  return { updated: false as const, reason: "already_paid_or_missing" as const };
}

export async function markOrderCancelledOnce(args: {
  orderId?: string;
  orderNumber?: string;
  reason: string;
}) {
  const where: Prisma.OrderWhereInput = {
    paymentStatus: { in: ["UNPAID", "PENDING"] },
    status: { in: ["PENDING", "AWAITING_PAYMENT"] },
  };
  if (args.orderId) where.id = args.orderId;
  else if (args.orderNumber) where.orderNumber = args.orderNumber;
  else throw new Error("orderId or orderNumber required");

  const result = await prisma.order.updateMany({
    where,
    data: {
      status: "CANCELLED",
      paymentStatus: "UNPAID",
    },
  });

  if (result.count === 1) {
    const order = await prisma.order.findFirst({
      where: args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber },
    });
    if (order) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "cancelled",
          message: args.reason,
        },
      });
    }
    return { updated: true as const };
  }
  return { updated: false as const, reason: "not_cancellable" as const };
}

export async function markOrderPaymentFailedOnce(args: {
  orderId?: string;
  orderNumber?: string;
  reason: string;
}) {
  const where: Prisma.OrderWhereInput = {
    paymentStatus: { in: ["UNPAID", "PENDING"] },
  };
  if (args.orderId) where.id = args.orderId;
  else if (args.orderNumber) where.orderNumber = args.orderNumber;
  else throw new Error("orderId or orderNumber required");

  const result = await prisma.order.updateMany({
    where,
    data: {
      paymentStatus: "FAILED",
      status: "AWAITING_PAYMENT",
    },
  });

  if (result.count === 1) {
    const order = await prisma.order.findFirst({
      where: args.orderId
        ? { id: args.orderId }
        : { orderNumber: args.orderNumber },
    });
    if (order) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_failed",
          message: args.reason,
        },
      });
    }
    return { updated: true as const };
  }
  return { updated: false as const, reason: "not_failable" as const };
}
