"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    router.push(`/shop/${slug}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8 items-end">
      {showShape && (
        <label className="text-sm">
          <span className="label">Shape</span>
          <select
            className="input w-auto min-w-[140px]"
            value={current.shape || ""}
            onChange={(e) => update("shape", e.target.value)}
          >
            <option value="">All shapes</option>
            {["drum", "empire", "oval", "rectangular", "coolie", "square"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-sm">
        <span className="label">Sort</span>
        <select
          className="input w-auto min-w-[160px]"
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
  );
}
