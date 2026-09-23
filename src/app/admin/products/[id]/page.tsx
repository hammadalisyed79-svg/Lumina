import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toNumber } from "@/lib/pricing";
import { AdminProductEditForm } from "@/components/admin/AdminProductEditForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { title: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="admin-muted text-sm hover:underline">
        ← Products
      </Link>
      <h1 className="admin-h1 mt-3">Edit product</h1>
      <p className="admin-muted mb-6">
        /{product.slug} · {product.variants.length} variants
      </p>
      <AdminProductEditForm
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          subtitle: product.subtitle,
          description: product.description,
          shortDesc: product.shortDesc,
          basePrice: toNumber(product.basePrice),
          published: product.published,
          featured: product.featured,
          bestseller: product.bestseller,
          shopifyProductId: product.shopifyProductId,
          shopifyHandle: product.shopifyHandle,
          seoTitle: product.seoTitle,
          seoDesc: product.seoDesc,
          shapeKey: product.shapeKey,
          images: product.images.map((i) => ({
            id: i.id,
            url: i.url,
            alt: i.alt || "",
            sortOrder: i.sortOrder,
          })),
          variants: product.variants.map((v) => ({
            id: v.id,
            title: v.title,
            sku: v.sku,
            priceOverride:
              v.priceOverride != null ? String(toNumber(v.priceOverride)) : "",
            shopifyVariantId: v.shopifyVariantId || "",
            active: v.active,
          })),
        }}
      />
    </div>
  );
}
