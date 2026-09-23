import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  status: z.enum([
    "PENDING",
    "AWAITING_PAYMENT",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  paymentStatus: z.enum([
    "UNPAID",
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
  ]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.order.update({
    where: { id },
    data: {
      ...parsed.data,
      events: {
        create: {
          type: "status_update",
          message: `Status → ${parsed.data.status}, payment → ${parsed.data.paymentStatus}`,
        },
      },
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.order.update",
    entity: "Order",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
