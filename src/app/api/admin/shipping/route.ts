import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  calcType: z.enum(["FLAT", "FREE_ABOVE", "WEIGHT"]),
  price: z.number().min(0),
  freeAbove: z.number().min(0).nullable().optional(),
  estimatedDays: z.string().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });

  const method = await prisma.shippingMethod.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      calcType: parsed.data.calcType,
      price: parsed.data.price,
      freeAbove: parsed.data.freeAbove ?? null,
      estimatedDays: parsed.data.estimatedDays || null,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.shipping.create",
    entity: "ShippingMethod",
    entityId: method.id,
  });

  return NextResponse.json({ id: method.id });
}
