import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/catalog";
import { toNumber } from "@/lib/pricing";
import { formatMoney, isWebImageUrl, shortDisplayTitle } from "@/lib/utils";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { ProductCard } from "@/components/shop/ProductCard";
import { ReviewForm } from "@/components/product/ReviewForm";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.seoTitle || product.title,
    description: product.seoDesc || product.shortDesc || undefined,
    openGraph: {
      images: product.images
        .filter((i) => isWebImageUrl(i.url))
        .slice(0, 1)
        .map((i) => ({ url: i.url })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const gallery = product.images.filter((i) => isWebImageUrl(i.url));
  const primaryImage = gallery[0]?.url;

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
  };

  return (
    <div className="container-site py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-[color:var(--muted)] mb-4 md:mb-6">
        <Link href="/">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop/lampshades">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-[color:var(--ink)]">{shortDisplayTitle(product.title, 40)}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="grid grid-cols-2 gap-3">
          {(gallery.length
            ? gallery
            : [{ id: "ph", url: primaryImage || "/media/products/handmade-by-order-luxury-teal-golden-wave-pattern-abstract-art-print-on-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes/03-83136991330682.jpg", alt: product.title }]
          ).map((img, idx) => (
            <div
              key={img.id}
              className={`relative overflow-hidden bg-[color:var(--stone)] ${idx === 0 ? "col-span-2 aspect-[4/5]" : "aspect-square"}`}
            >
              <Image
                src={img.url}
                alt={img.alt || product.title}
                fill
                className="object-cover object-center"
                priority={idx === 0}
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">{product.title}</h1>
          {product.subtitle && (
            <p className="text-[color:var(--muted)] mb-4">{product.subtitle}</p>
          )}
          <p className="text-lg mb-6">From {formatMoney(product.basePrice)}</p>
          <p className="prose-muted mb-8">{product.shortDesc || product.description.slice(0, 220)}</p>

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

          <div className="mt-10">
            <h2 className="font-display text-2xl mb-4">Reviews</h2>
            <div className="space-y-5 mb-8">
              {product.reviews.length === 0 && (
                <p className="prose-muted text-sm">No reviews yet — be the first.</p>
              )}
              {product.reviews.map((r) => (
                <div key={r.id} className="border-t border-[color:var(--line)] pt-4">
                  <p className="text-[color:var(--bronze)] text-sm tracking-widest">
                    {"★".repeat(r.rating)}
                  </p>
                  {r.title && <p className="font-medium mt-1">{r.title}</p>}
                  <p className="prose-muted text-sm mt-1">{r.body}</p>
                  <p className="text-xs text-[color:var(--muted)] mt-2">{r.author}</p>
                </div>
              ))}
            </div>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl mb-8">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
