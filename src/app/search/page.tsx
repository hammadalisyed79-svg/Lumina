import Link from "next/link";
import { listProductsForShop } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

const SUGGESTIONS = [
  { href: "/shop/lampshades?shape=drum", label: "Drum lampshades" },
  { href: "/shop/lampshades?shape=empire", label: "Empire" },
  { href: "/shop/fabrics", label: "Fabrics" },
  { href: "/shop/cushions", label: "Cushions" },
  { href: "/shop/bestsellers", label: "Bestsellers" },
  { href: "/design-your-shade", label: "Design your shade" },
];

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const { products } = query
    ? await listProductsForShop({ query: { q: query } })
    : { products: [] };

  return (
    <div className="container-site py-12">
      <h1 className="font-display text-4xl mb-3">Search</h1>
      <form className="mb-10 max-w-xl" action="/search" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search lampshades, fabrics, cushions…"
          className="input"
          autoFocus
        />
      </form>

      {!query && (
        <div className="max-w-2xl">
          <p className="prose-muted mb-4">Try a colour, pattern or shape — or browse:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="btn-secondary text-sm">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && (
        <p className="text-sm text-[color:var(--muted)] mb-6">
          {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      {query && products.length === 0 && (
        <div className="py-8 space-y-4">
          <p className="prose-muted">No matches. Try a shorter term or browse by shape.</p>
          <Link href="/shop/lampshades" className="btn-primary inline-flex">
            Shop lampshades
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
