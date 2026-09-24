import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  title: z.string().min(2).optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(2).optional(),
  shortDesc: z.string().nullable().optional(),
  basePrice: z.number().positive().optional(),
  slug: z.string().min(2).optional(),
  leadTimeDays: z.number().int().min(1).max(120).optional(),
  shopifyProductId: z.string().nullable().optional(),
  shopifyHandle: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  shapeKey: z.string().nullable().optional(),
  adminFieldsLocked: z.boolean().optional(),
  migrationStatus: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().min(1),
        alt: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        priceOverride: z.number().nullable().optional(),
        shopifyVariantId: z.string().nullable().optional(),
        active: z.boolean().optional(),
        sku: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { images, variants, ...productData } = parsed.data;

  // Any customer-facing edit locks fields against future import overwrites
  const lockOnEdit =
    productData.title != null ||
    productData.description != null ||
    productData.shortDesc != null ||
    productData.seoTitle != null ||
    productData.seoDesc != null ||
    productData.published != null;

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        ...productData,
        ...(lockOnEdit && productData.adminFieldsLocked !== false
          ? { adminFieldsLocked: true }
          : {}),
      },
    });

    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img, i) => ({
            productId: id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder ?? i,
          })),
        });
      }
    }

    if (variants?.length) {
      for (const v of variants) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            ...(v.title != null ? { title: v.title } : {}),
            ...(v.sku != null ? { sku: v.sku } : {}),
            ...(v.active != null ? { active: v.active } : {}),
            ...(v.shopifyVariantId !== undefined
              ? { shopifyVariantId: v.shopifyVariantId }
              : {}),
            ...(v.priceOverride !== undefined
              ? { priceOverride: v.priceOverride }
              : {}),
          },
        });
      }
    }

    return updated;
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.product.update",
    entity: "Product",
    entityId: id,
    meta: {
      fields: Object.keys(productData),
      imageCount: images?.length,
      variantUpdates: variants?.length,
    },
  });

  return NextResponse.json({ product });
}
