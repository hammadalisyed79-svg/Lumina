import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { formatGBP } from "@/lib/money";
import { getProductByHandle, getRelated } from "@/lib/products";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  ensureSeeded();
  const { handle } = await params;
  const product = getProductByHandle(handle);
  if (!product) notFound();
  const related = getRelated(product.handle, product.category, 4);
  const gallery = product.images.length ? product.images : product.image ? [product.image] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-xs text-[var(--muted)] mb-8 flex gap-2 flex-wrap">
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] line-clamp-1">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] bg-[var(--stone)] overflow-hidden">
            {gallery[0] && (
              <Image
                src={gallery[0]}
                alt={product.title}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 8).map((src) => (
                <div key={src} className="relative aspect-square bg-[var(--stone)] overflow-hidden">
                  <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)]">
            {product.category}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--ink)] leading-tight">
            {product.title}
          </h1>
          <p className="mt-5 text-2xl font-medium">{formatGBP(product.price)}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Handmade to order · Free UK shipping over £75
          </p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          {product.description && (
            <div className="mt-10 pt-8 border-t border-[var(--line)]">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
                Details
              </h2>
              <p className="text-[var(--ink)]/85 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] uppercase tracking-wider border border-[var(--line)] px-2.5 py-1 text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl mb-8">
            You may also like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
