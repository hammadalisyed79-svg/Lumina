"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ShopFilters({
  slug,
  current,
  showShape,
}: {
  slug: string;
  current: Record<string, string | undefined>;
  showShape?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`/shop/${slug}?${params.toString()}`);
  }

  const hasFilters = Boolean(current.shape || current.sort || current.min || current.max);

  return (
    <div className="mb-6 md:mb-8 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        {showShape && (
          <label className="text-sm col-span-2 sm:col-auto">
            <span className="label">Shape</span>
            <select
              className="input w-full sm:w-auto sm:min-w-[140px]"
              value={current.shape || ""}
              onChange={(e) => update("shape", e.target.value)}
            >
              <option value="">All shapes</option>
              {["drum", "empire", "oval", "rectangular", "coolie", "square"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          <span className="label">Price from</span>
          <select
            className="input w-full sm:w-auto sm:min-w-[120px]"
            value={current.min || ""}
            onChange={(e) => update("min", e.target.value)}
          >
            <option value="">Any</option>
            <option value="25">£25</option>
            <option value="50">£50</option>
            <option value="75">£75</option>
            <option value="100">£100</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="label">Price to</span>
          <select
            className="input w-full sm:w-auto sm:min-w-[120px]"
            value={current.max || ""}
            onChange={(e) => update("max", e.target.value)}
          >
            <option value="">Any</option>
            <option value="50">£50</option>
            <option value="75">£75</option>
            <option value="100">£100</option>
            <option value="150">£150</option>
          </select>
        </label>
        <label className="text-sm col-span-2 sm:col-auto">
          <span className="label">Sort</span>
          <select
            className="input w-full sm:w-auto sm:min-w-[160px]"
            value={current.sort || ""}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="title">Name</option>
            <option value="featured">Featured</option>
          </select>
        </label>
      </div>
      {hasFilters && (
        <Link href={`/shop/${slug}`} className="text-sm underline text-[color:var(--muted)]">
          Clear filters
        </Link>
      )}
    </div>
  );
}
