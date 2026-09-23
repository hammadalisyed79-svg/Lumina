import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["FINISHED", "KIT", "FABRIC", "COMPONENT", "OTHER"]).optional(),
  available: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  trackStock: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid inventory item" }, { status: 400 });

  const exists = await prisma.inventoryItem.findUnique({ where: { sku: parsed.data.sku } });
  if (exists) return NextResponse.json({ error: "SKU already exists" }, { status: 409 });

  const available = parsed.data.available ?? 0;
  const item = await prisma.inventoryItem.create({
    data: {
      sku: parsed.data.sku,
      name: parsed.data.name,
      kind: parsed.data.kind ?? "OTHER",
      available,
      reorderLevel: parsed.data.reorderLevel ?? 0,
      trackStock: parsed.data.trackStock ?? true,
    },
  });

  if (available > 0) {
    await prisma.inventoryMovement.create({
      data: {
        itemId: item.id,
        delta: available,
        reason: "initial_stock",
        note: "Created via admin",
        userId: session.user.id,
      },
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.inventory.create",
    entity: "InventoryItem",
    entityId: item.id,
  });

  return NextResponse.json({ id: item.id });
}
