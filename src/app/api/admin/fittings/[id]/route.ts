import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  compatibility: z.string().nullable().optional(),
  priceMod: z.number().optional(),
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
    const clash = await prisma.fitting.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    data.slug = slug;
  }

  const fitting = await prisma.fitting.update({ where: { id }, data });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.fitting.update",
    entity: "Fitting",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ fitting });
}
