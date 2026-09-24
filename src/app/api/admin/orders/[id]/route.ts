import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/admin/orders";
import { isStaffRole, roleHasPermission } from "@/lib/auth/permissions";
import { emitOrderEmailEvent } from "@/lib/orders/emails";
import type { Role } from "@prisma/client";

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
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role as Role;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const d = parsed.data;
  const fulfilmentKeys =
    d.trackingProvider !== undefined ||
    d.trackingNumber !== undefined ||
    d.productionStatus !== undefined ||
    d.markDispatched;
  const editKeys = d.status !== undefined || d.paymentStatus !== undefined;
  const notesKeys = d.staffNotes !== undefined;

  if (fulfilmentKeys) {
    const ok =
      role === "SUPER_ADMIN" || (await roleHasPermission(role, "orders.fulfil"));
    if (!ok) {
      return NextResponse.json(
        { error: "Missing orders.fulfil permission" },
        { status: 403 }
      );
    }
  }
  if (editKeys) {
    const ok =
      role === "SUPER_ADMIN" || (await roleHasPermission(role, "orders.edit"));
    if (!ok) {
      return NextResponse.json(
        { error: "Missing orders.edit permission" },
        { status: 403 }
      );
    }
  }
  if (notesKeys) {
    const ok =
      role === "SUPER_ADMIN" || (await roleHasPermission(role, "orders.notes"));
    if (!ok) {
      return NextResponse.json(
        { error: "Missing orders.notes permission" },
        { status: 403 }
      );
    }
  }

  const data: Record<string, unknown> = {};
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

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...data,
      events: {
        create: {
          type: "status_update",
          message: messageParts.join(", "),
          meta: { actorId: session.user.id },
        },
      },
    },
  });

  if (d.markDispatched || d.status === "SHIPPED" || d.status === "DISPATCHED") {
    await emitOrderEmailEvent({
      type: "order_shipped",
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      meta: {
        trackingProvider: order.trackingProvider,
        trackingNumber: order.trackingNumber,
      },
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.order.update",
    entity: "Order",
    entityId: id,
    meta: d,
  });

  return NextResponse.json({ ok: true });
}
