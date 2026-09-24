import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CollectionEditForm } from "@/components/admin/CollectionEditForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCollectionEditPage({ params }: Props) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      products: { orderBy: { sortOrder: "asc" }, select: { productId: true } },
    },
  });
  if (!collection) notFound();

  const allProducts = await prisma.product.findMany({
    where: { archived: false },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true },
    take: 2000,
  });

  return (
    <div>
      <Link href="/admin/collections" className="admin-muted text-sm hover:underline">
        ← Collections
      </Link>
      <h1 className="admin-h1 mt-3">Edit collection</h1>
      <p className="admin-muted mb-6">/{collection.slug}</p>
      <CollectionEditForm
        collection={{
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          description: collection.description,
          imageUrl: collection.imageUrl,
          sortOrder: collection.sortOrder,
          published: collection.published,
          isFeatured: collection.isFeatured,
          seoTitle: collection.seoTitle,
          seoDesc: collection.seoDesc,
          productIds: collection.products.map((p) => p.productId),
        }}
        allProducts={allProducts}
      />
    </div>
  );
}
