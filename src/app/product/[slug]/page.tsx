import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog";
import { toNumber } from "@/lib/pricing";
import { formatMoney, isWebImageUrl, shortDisplayTitle } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/image";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductCard } from "@/components/shop/ProductCard";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ProductReviewsList } from "@/components/product/ProductReviewsList";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { SITE } from "@/lib/site";
import {
  DEFAULT_OG_IMAGE,
  JsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  const title = product.seoTitle || product.title;
  const description = product.seoDesc || product.shortDesc || undefined;
  const ogImage =
    product.images.find((i) => isWebImageUrl(i.url))?.url || DEFAULT_OG_IMAGE;
  const image = normalizeImageSrc(ogImage);
  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: `${shortDisplayTitle(title, 60)} | Lumina Hub`,
      description,
      url: `/product/${slug}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${shortDisplayTitle(title, 60)} | Lumina Hub`,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const gallery = product.images.filter((i) => isWebImageUrl(i.url));
  const primaryImage = gallery[0]?.url;
  const displayTitle = shortDisplayTitle(product.title, 72);

  const related = product.relatedFrom
    .map((r) => {
      const imageUrl = r.to.images.find((i) => isWebImageUrl(i.url))?.url;
      if (!imageUrl) return null;
      return {
        id: r.to.id,
        slug: r.to.slug,
        title: r.to.title,
        subtitle: r.to.subtitle,
        basePrice: toNumber(r.to.basePrice),
        imageUrl,
        hoverImageUrl: r.to.images.find(
          (i, idx) => idx > 0 && isWebImageUrl(i.url)
        )?.url,
      };
    })
    .filter(Boolean) as {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    basePrice: number;
    imageUrl: string;
    hoverImageUrl?: string;
  }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDesc || product.description,
    image: gallery.map((i) => i.url),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: toNumber(product.basePrice).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    ...(product.reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (
              product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
            ).toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  const fallbackImg =
    "/media/products/handmade-by-order-luxury-teal-golden-wave-pattern-abstract-art-print-on-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes/03-83136991330682.jpg";

  return (
    <div>
      <ProductViewTracker
        itemId={product.id}
        itemName={product.title}
        price={toNumber(product.basePrice)}
      />
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop/lampshades" },
          { name: shortDisplayTitle(product.title, 48), path: `/product/${product.slug}` },
        ])}
      />

      <div className="container-site py-8 md:py-12">
        <nav className="page-crumb">
          <Link href="/">Home</Link>
          <span className="mx-2 text-line">/</span>
          <Link href="/shop/lampshades">Shop</Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ink">{shortDisplayTitle(product.title, 36)}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="grid grid-cols-2 gap-3">
            {(gallery.length
              ? gallery
              : [{ id: "ph", url: primaryImage || fallbackImg, alt: product.title }]
            ).map((img, idx) => (
              <div
                key={img.id}
                className={`group relative overflow-hidden bg-stone ${
                  idx === 0 ? "col-span-2 aspect-[4/5]" : "aspect-square"
                }`}
              >
                <MediaImage
                  src={img.url}
                  alt={img.alt || product.title}
                  fill
                  className="object-cover object-center img-zoom"
                  {...(idx === 0
                    ? { priority: true as const }
                    : { loading: "lazy" as const })}
                  sizes={
                    idx === 0
                      ? "(max-width:1024px) 100vw, 50vw"
                      : "(max-width:1024px) 50vw, 25vw"
                  }
                />
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-3">
              {product.type === "LAMPSHADE"
                ? "Lampshade"
                : product.type === "FABRIC"
                  ? "Fabric"
                  : product.type === "CUSHION"
                    ? "Cushion"
                    : "Studio piece"}
            </p>
            <h1 className="font-display text-[2.15rem] sm:text-4xl md:text-5xl leading-[1.05] tracking-tight mb-3">
              {displayTitle}
            </h1>
            {product.subtitle && (
              <p className="text-muted mb-4 leading-relaxed">{product.subtitle}</p>
            )}
            <p className="text-lg tracking-wide mb-6">
              From {formatMoney(product.basePrice)}
            </p>
            <div className="lux-rule" />
            <p className="prose-muted mb-8 max-w-md">
              {product.shortDesc || product.description.slice(0, 240)}
            </p>

            <ProductConfigurator
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                basePrice: toNumber(product.basePrice),
                imageUrl: primaryImage || gallery[0]?.url,
                configEnabled: product.configEnabled,
                type: product.type,
                shapeKey: product.shapeKey,
                leadTimeDays: product.leadTimeDays,
                variants: product.variants.map((v) => ({
                  id: v.id,
                  title: v.title,
                  sku: v.sku,
                  priceOverride: v.priceOverride ? toNumber(v.priceOverride) : null,
                  shopifyVariantId: v.shopifyVariantId,
                  option1: v.option1,
                  option2: v.option2,
                  option3: v.option3,
                  active: v.active,
                })),
              }}
            />

            <ProductAccordions
              description={product.description}
              leadTimeDays={product.leadTimeDays}
            />

            <div className="mt-12 pt-2">
              <p className="eyebrow mb-2">Reviews</p>
              <h2 className="font-display text-3xl tracking-tight mb-6">Kind words</h2>
              <div className="mb-8">
                <ProductReviewsList reviews={product.reviews} />
              </div>
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-ivory/40">
          <div className="container-site section-pad">
            <p className="eyebrow mb-3">Continue</p>
            <h2 className="section-title mb-8 md:mb-10">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
