import { listProductsForShop } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const { products } = query
    ? await listProductsForShop({ query: { q: query } })
    : { products: [] };

  return (
    <div className="container-site py-12">
      <h1 className="font-display text-4xl mb-3">Search</h1>
      <form className="mb-10 max-w-xl">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search products…"
          className="input"
        />
      </form>
      {query && (
        <p className="text-sm text-[color:var(--muted)] mb-6">
          {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
