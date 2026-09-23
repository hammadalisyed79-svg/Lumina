import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  title: z.string().optional(),
  basePrice: z.number().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.product.update",
    entity: "Product",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ product });
}
