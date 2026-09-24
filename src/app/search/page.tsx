import Link from "next/link";
import { listProductsForShop } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

const SUGGESTIONS = [
  { href: "/shop/lampshades?shape=drum", label: "Drum lampshades" },
  { href: "/shop/lampshades?shape=empire", label: "Empire" },
  { href: "/shop/fabrics", label: "Fabrics" },
  { href: "/shop/cushions", label: "Cushion covers" },
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
    <div className="container-site section-pad">
      <header className="mb-8 md:mb-10 max-w-xl">
        <p className="eyebrow mb-3">Catalogue</p>
        <h1 className="section-title mb-3">Search</h1>
        <div className="lux-rule" />
      </header>
      <form className="mb-10 max-w-xl" action="/search" method="get">
        <label className="block">
          <span className="label">Find a piece</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Colour, pattern, shape…"
            className="input"
            autoFocus
          />
        </label>
      </form>

      {!query && (
        <div className="max-w-2xl">
          <p className="prose-muted mb-5">{COPY.searchEmpty}</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="btn-quiet text-sm !py-2 !px-3">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && (
        <p className="text-sm text-muted mb-6">
          {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      {query && products.length === 0 && (
        <EmptyState
          eyebrow="Search"
          title={COPY.searchNoResults.title}
          body={COPY.searchNoResults.body}
          primary={{ href: "/shop/lampshades", label: "Shop lampshades" }}
          secondary={{ href: "/design-your-shade", label: "Design a shade", variant: "secondary" }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
