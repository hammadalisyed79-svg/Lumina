import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  calcType: z.enum(["FLAT", "FREE_ABOVE", "WEIGHT"]).optional(),
  price: z.number().min(0).optional(),
  freeAbove: z.number().min(0).nullable().optional(),
  estimatedDays: z.string().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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

  const method = await prisma.shippingMethod.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.shipping.update",
    entity: "ShippingMethod",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ method });
}
