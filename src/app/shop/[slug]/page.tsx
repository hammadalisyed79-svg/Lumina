import type { Metadata } from "next";
import Link from "next/link";
import { listProductsForShop, getCollectionBySlug } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopPagination } from "@/components/shop/ShopPagination";
import { ProductType } from "@prisma/client";
import { COPY } from "@/lib/copy";

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
  const page = Math.max(1, Number(sp.page) || 1);

  const { products, total, pageSize } = await listProductsForShop({
    collectionSlug: !type && collection ? slug : undefined,
    type,
    page,
    query: {
      shape: sp.shape,
      sort: sp.sort,
      q: sp.q,
      mood: sp.mood,
      min: sp.min,
      max: sp.max,
    },
  });

  const typeTitles: Partial<Record<ProductType, string>> = {
    LAMPSHADE: "Lampshades",
    FABRIC: "Fabrics",
    CUSHION: "Cushions",
    KIT: "Kits",
  };
  const typeEyebrows: Partial<Record<ProductType, string>> = {
    LAMPSHADE: "Lampshade",
    FABRIC: "Fabric",
    CUSHION: "Cushion",
    KIT: "Kit",
  };
  const title =
    (type ? typeTitles[type] : null) ||
    collection?.title ||
    slug.replace(/-/g, " ");

  const showShape = type === "LAMPSHADE" || (!type && Boolean(collection));

  const eyebrow = type ? typeEyebrows[type] || "Shop" : "Collection";

  return (
    <div className="container-site section-pad">
      <nav className="page-crumb">
        <Link href="/">Home</Link>
        <span className="mx-2 text-line">/</span>
        <Link href="/shop/lampshades">Shop</Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink capitalize">{title}</span>
      </nav>
      <div className="mb-10 md:mb-14 max-w-2xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="section-title capitalize mb-3">{title}</h1>
        <div className="lux-rule" />
        {collection?.description && !type && (
          <p className="prose-muted">{collection.description}</p>
        )}
        {type === "LAMPSHADE" && (
          <p className="prose-muted">{COPY.shopIntros.LAMPSHADE}</p>
        )}
        {type === "FABRIC" && (
          <p className="prose-muted">{COPY.shopIntros.FABRIC}</p>
        )}
        {type === "CUSHION" && (
          <p className="prose-muted">{COPY.shopIntros.CUSHION}</p>
        )}
        {type === "KIT" && (
          <p className="prose-muted">{COPY.shopIntros.KIT}</p>
        )}
      </div>
      <ShopFilters slug={slug} current={sp} showShape={showShape} />
      <p className="text-sm text-[color:var(--muted)] mb-4">
        {total} {total === 1 ? "piece" : "pieces"}
        {total > pageSize ? ` · showing ${products.length} on this page` : null}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <div className="py-16 text-center space-y-4">
          <p className="prose-muted">No products match these filters.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/shop/${slug}`} className="btn-secondary">
              Clear filters
            </Link>
            <Link href="/shop/lampshades" className="btn-primary">
              Browse lampshades
            </Link>
          </div>
        </div>
      )}
      <ShopPagination
        slug={slug}
        page={page}
        pageSize={pageSize}
        total={total}
        current={sp}
      />
    </div>
  );
}
