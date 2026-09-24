import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole, roleHasPermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/security/audit";
import type { Role } from "@prisma/client";

const schema = z.object({
  staffNotes: z.string().max(5000).nullable().optional(),
  appendNote: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const role = session.user.role as Role;
  const canNotes =
    role === "SUPER_ADMIN" || (await roleHasPermission(role, "orders.notes"));
  if (!canNotes) {
    return NextResponse.json({ error: "Missing orders.notes permission" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { staffNotes?: string | null } = {};
  if (parsed.data.staffNotes !== undefined) {
    data.staffNotes = parsed.data.staffNotes;
  }

  await prisma.order.update({
    where: { id },
    data: {
      ...data,
      ...(parsed.data.appendNote
        ? {
            events: {
              create: {
                type: "internal_note",
                message: parsed.data.appendNote,
                meta: { authorId: session.user.id },
              },
            },
          }
        : {}),
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.order.notes",
    entity: "Order",
    entityId: id,
    meta: {
      staffNotesUpdated: parsed.data.staffNotes !== undefined,
      appendNote: !!parsed.data.appendNote,
    },
  });

  return NextResponse.json({ ok: true });
}
