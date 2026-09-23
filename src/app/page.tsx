import Link from "next/link";
import { Hero } from "@/components/Hero";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/products";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default function HomePage() {
  ensureSeeded();
  const { products } = listProducts({ featured: true, limit: 8 });

  return (
    <>
      <Hero />
      <CategoryShowcase />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
              Featured pieces
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--ink)]">
              Made for the glow
            </h2>
          </div>
          <Link href="/shop" className="btn-outline self-start sm:self-auto">
            View all products
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="relative mt-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
              Our craft
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--ink)] leading-tight">
              One shade at a time, in the UK
            </h2>
            <p className="mt-5 text-[var(--muted)] leading-relaxed max-w-lg">
              We blend timeless silhouettes with rich textures — velvet, linen,
              and prints made on demand — so every piece feels warm, refined,
              and wholly yours. Free UK shipping on orders over £75.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn-primary">
                Read our story
              </Link>
              <Link href="/size-fitting" className="btn-outline">
                Size & fitting guide
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: "Handmade", d: "Crafted to order by skilled makers" },
              { t: "Bespoke prints", d: "Velvet fabrics printed on demand" },
              { t: "All shapes", d: "Drum, oval, rectangular, empire & more" },
              { t: "UK studio", d: "Designed and fulfilled in Britain" },
            ].map((item) => (
              <div
                key={item.t}
                className="bg-white/70 border border-[var(--line)] p-5 sm:p-6"
              >
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {item.t}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
