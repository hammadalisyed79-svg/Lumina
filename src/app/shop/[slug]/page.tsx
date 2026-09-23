import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { listProductsForShop, getCollectionBySlug } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopPagination } from "@/components/shop/ShopPagination";
import { ProductType } from "@prisma/client";
import { COPY } from "@/lib/copy";
import {
  DEFAULT_OG_IMAGE,
  JsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { normalizeImageSrc } from "@/lib/image";
import { isWebImageUrl } from "@/lib/utils";

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

async function resolveShopOgImage(slug: string, collectionImageUrl?: string | null) {
  if (collectionImageUrl && isWebImageUrl(collectionImageUrl)) {
    return normalizeImageSrc(collectionImageUrl);
  }
  const type = TYPE_MAP[slug];
  const product = await prisma.product.findFirst({
    where: {
      published: true,
      ...(type
        ? { type }
        : {
            collections: { some: { collection: { slug } } },
          }),
      images: { some: { NOT: { url: { contains: ".heic" } } } },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 3 } },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
  const url = product?.images.find((i) => isWebImageUrl(i.url))?.url;
  return url ? normalizeImageSrc(url) : DEFAULT_OG_IMAGE;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  const type = TYPE_MAP[slug];
  const typeMeta = type ? COPY.shopMeta[type] : null;

  const title =
    collection?.seoTitle ||
    collection?.title ||
    typeMeta?.title ||
    slug.replace(/-/g, " ");
  const description =
    collection?.seoDesc ||
    collection?.description ||
    typeMeta?.description ||
    COPY.metaDescription;

  const ogImage = await resolveShopOgImage(slug, collection?.imageUrl);

  return {
    title,
    description,
    alternates: {
      canonical: `/shop/${slug}`,
    },
    openGraph: {
      title: `${title} | Lumina Hub`,
      description,
      url: `/shop/${slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Lumina Hub`,
      description,
      images: [ogImage],
    },
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop/lampshades" },
          { name: title, path: `/shop/${slug}` },
        ])}
      />
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
        {type && COPY.shopIntros[type] && (
          <p className="prose-muted">{COPY.shopIntros[type]}</p>
        )}
      </div>
      <ShopFilters slug={slug} current={sp} showShape={showShape} />
      <p className="text-sm text-muted mb-4">
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
