import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  internalCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  swatchUrl: z.string().nullable().optional(),
  priceMod: z.number().optional(),
  stockQty: z.number().int().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data = { ...parsed.data };
  if (data.slug) {
    const slug = slugify(data.slug);
    const clash = await prisma.fabric.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    data.slug = slug;
  }

  const fabric = await prisma.fabric.update({ where: { id }, data });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.fabric.update",
    entity: "Fabric",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ fabric });
}
