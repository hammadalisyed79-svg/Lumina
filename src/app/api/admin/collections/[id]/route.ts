import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  productIds: z.array(z.string()).optional(),
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

  const { productIds, ...rest } = parsed.data;
  const data = { ...rest };
  if (data.slug) {
    const slug = slugify(data.slug);
    const clash = await prisma.collection.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    data.slug = slug;
  }

  const collection = await prisma.$transaction(async (tx) => {
    const updated = await tx.collection.update({ where: { id }, data });
    if (productIds) {
      await tx.collectionProduct.deleteMany({ where: { collectionId: id } });
      if (productIds.length) {
        await tx.collectionProduct.createMany({
          data: productIds.map((productId, i) => ({
            collectionId: id,
            productId,
            sortOrder: i,
          })),
        });
      }
    }
    return updated;
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.collection.update",
    entity: "Collection",
    entityId: id,
    meta: { ...parsed.data, productCount: productIds?.length },
  });

  return NextResponse.json({ collection });
}
