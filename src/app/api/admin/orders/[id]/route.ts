import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/admin/orders";

const schema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  trackingProvider: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  staffNotes: z.string().nullable().optional(),
  productionStatus: z
    .enum(["NONE", "QUEUED", "IN_PRODUCTION", "QC", "PACKED", "DISPATCHED", "COMPLETE"])
    .optional(),
  markDispatched: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.status) data.status = d.status;
  if (d.paymentStatus) data.paymentStatus = d.paymentStatus;
  if (d.trackingProvider !== undefined) data.trackingProvider = d.trackingProvider;
  if (d.trackingNumber !== undefined) data.trackingNumber = d.trackingNumber;
  if (d.staffNotes !== undefined) data.staffNotes = d.staffNotes;
  if (d.productionStatus) data.productionStatus = d.productionStatus;
  if (d.markDispatched) data.dispatchedAt = new Date();

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const messageParts = Object.entries(data)
    .filter(([k]) => k !== "dispatchedAt")
    .map(([k, v]) => `${k} → ${v}`);
  if (d.markDispatched) messageParts.push("dispatchedAt set");

  await prisma.order.update({
    where: { id },
    data: {
      ...data,
      events: {
        create: {
          type: "status_update",
          message: messageParts.join(", "),
        },
      },
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.order.update",
    entity: "Order",
    entityId: id,
    meta: d,
  });

  return NextResponse.json({ ok: true });
}
