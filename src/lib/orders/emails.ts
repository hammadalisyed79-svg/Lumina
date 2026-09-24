import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Email event stubs — records intent without sending live mail in Phase 3.
 * Wire Resend/transactional providers in a later phase.
 */
export type OrderEmailEventType =
  | "order_created"
  | "order_confirmed"
  | "payment_received"
  | "production_started"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export async function emitOrderEmailEvent(args: {
  type: OrderEmailEventType;
  orderId: string;
  orderNumber: string;
  email: string;
  meta?: Prisma.InputJsonValue;
}) {
  await prisma.orderEvent.create({
    data: {
      orderId: args.orderId,
      type: `email_stub:${args.type}`,
      message: `Email stub queued: ${args.type} → ${args.email} (${args.orderNumber})`,
      meta: {
        emailType: args.type,
        to: args.email,
        status: "stubbed",
        ...(args.meta && typeof args.meta === "object" && !Array.isArray(args.meta)
          ? (args.meta as object)
          : { payload: args.meta }),
      },
    },
  });

  return { queued: false, stubbed: true as const };
}
