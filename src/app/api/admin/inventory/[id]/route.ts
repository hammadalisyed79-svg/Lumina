import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  adjustBy: z.number().int().optional(),
  available: z.number().int().min(0).optional(),
  name: z.string().min(1).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  trackStock: z.boolean().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let newAvailable = existing.available;
  if (parsed.data.adjustBy != null) {
    newAvailable = existing.available + parsed.data.adjustBy;
  } else if (parsed.data.available != null) {
    newAvailable = parsed.data.available;
  }

  if (newAvailable < 0) {
    return NextResponse.json({ error: "Available count cannot be negative" }, { status: 400 });
  }

  const delta = newAvailable - existing.available;
  const { adjustBy: _a, available: _b, reason, note, ...rest } = parsed.data;

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id },
      data: { ...rest, available: newAvailable },
    });

    if (delta !== 0) {
      await tx.inventoryMovement.create({
        data: {
          itemId: id,
          delta,
          reason: reason || "manual_adjustment",
          note: note || null,
          userId: session.user.id,
        },
      });
    }

    return updated;
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.inventory.update",
    entity: "InventoryItem",
    entityId: id,
    meta: { ...parsed.data, delta },
  });

  return NextResponse.json({ item });
}
