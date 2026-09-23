import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, listProducts } from "@/lib/products";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

const SORTS = [
  { value: "newest", label: "Featured" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "title", label: "Name" },
] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  ensureSeeded();
  const sp = await searchParams;
  const category = sp.category || "All";
  const q = sp.q || "";
  const sort = (sp.sort as "newest" | "price-asc" | "price-desc" | "title") || "newest";
  const page = Math.max(1, Number(sp.page || 1));
  const limit = 24;
  const offset = (page - 1) * limit;

  const categories = getCategories();
  const { products, total } = listProducts({
    category: category === "All" ? undefined : category,
    q: q || undefined,
    sort,
    limit,
    offset,
  });
  const pages = Math.max(1, Math.ceil(total / limit));

  function href(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      category: category !== "All" ? category : undefined,
      q: q || undefined,
      sort: sort !== "newest" ? sort : undefined,
      page: undefined as string | undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const s = params.toString();
    return s ? `/shop?${s}` : "/shop";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
          Collection
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-[var(--ink)]">
          {category === "All" ? "Shop all" : category}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {total} handmade piece{total === 1 ? "" : "s"}
          {q ? ` matching “${q}”` : ""}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-56 shrink-0 space-y-6">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
              Categories
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={href({ category: undefined, page: undefined })}
                  className={category === "All" ? "text-[var(--brass)] font-medium" : ""}
                >
                  All ({categories.reduce((s, c) => s + c.count, 0)})
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.name}>
                  <Link
                    href={href({ category: c.name, page: undefined })}
                    className={
                      category === c.name ? "text-[var(--brass)] font-medium" : ""
                    }
                  >
                    {c.name} ({c.count})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <form action="/shop" className="flex gap-2 flex-1 max-w-md">
              {category !== "All" && (
                <input type="hidden" name="category" value={category} />
              )}
              <input
                name="q"
                defaultValue={q}
                placeholder="Search…"
                className="field"
              />
              <button type="submit" className="btn-outline shrink-0">
                Search
              </button>
            </form>
            <div className="flex gap-2 text-sm">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={href({ sort: s.value === "newest" ? undefined : s.value })}
                  className={`px-3 py-1.5 border ${
                    sort === s.value
                      ? "border-[var(--brass)] text-[var(--brass)]"
                      : "border-[var(--line)]"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <p className="text-[var(--muted)] py-20 text-center">
              No products found. Try another category or search.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={href({ page: p === 1 ? undefined : String(p) })}
                  className={`w-10 h-10 flex items-center justify-center border text-sm ${
                    p === page
                      ? "border-[var(--brass)] text-[var(--brass)]"
                      : "border-[var(--line)]"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
