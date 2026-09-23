import Link from "next/link";
import { listProductsForShop, getCollectionBySlug } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ProductType } from "@prisma/client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TYPE_MAP: Record<string, ProductType | undefined> = {
  lampshades: "LAMPSHADE",
  fabrics: "FABRIC",
  cushions: "CUSHION",
  kits: "KIT",
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  return {
    title: collection?.seoTitle || collection?.title || slug,
    description: collection?.seoDesc || collection?.description || undefined,
  };
}

export default async function ShopCollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const collection = await getCollectionBySlug(slug);
  const type = TYPE_MAP[slug];
  const { products } = await listProductsForShop({
    collectionSlug: collection ? slug : undefined,
    type: !collection ? type : undefined,
    query: {
      shape: sp.shape,
      sort: sp.sort,
      q: sp.q,
      mood: sp.mood,
      min: sp.min,
      max: sp.max,
    },
  });

  // mood routes like linen-calm, botanical, bestsellers, new
  const title = collection?.title || slug.replace(/-/g, " ");

  return (
    <div className="container-site py-10 md:py-14">
      <nav className="text-sm text-[color:var(--muted)] mb-6">
        <Link href="/">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[color:var(--ink)] capitalize">{title}</span>
      </nav>
      <div className="mb-6 md:mb-8 max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl capitalize mb-3">{title}</h1>
        {collection?.description && (
          <p className="prose-muted">{collection.description}</p>
        )}
      </div>
      <ShopFilters slug={slug} current={sp} showShape={slug === "lampshades" || !!TYPE_MAP[slug] === false} />
      <p className="text-sm text-[color:var(--muted)] mb-4">{products.length} pieces</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="prose-muted py-16 text-center">No products match these filters.</p>
      )}
    </div>
  );
}
