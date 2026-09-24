"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProductOpt = { id: string; title: string; slug: string };

type Props = {
  collection: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    published: boolean;
    isFeatured: boolean;
    seoTitle: string | null;
    seoDesc: string | null;
    productIds: string[];
  };
  allProducts: ProductOpt[];
};

export function CollectionEditForm({ collection, allProducts }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(collection.productIds);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [allProducts, filter]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/collections/${collection.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(fd.get("title")),
        slug: String(fd.get("slug")),
        description: String(fd.get("description") || "") || null,
        imageUrl: String(fd.get("imageUrl") || "") || null,
        sortOrder: Number(fd.get("sortOrder") || 0),
        published: fd.get("published") === "on",
        isFeatured: fd.get("isFeatured") === "on",
        seoTitle: String(fd.get("seoTitle") || "") || null,
        seoDesc: String(fd.get("seoDesc") || "") || null,
        productIds: selected,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Name</span>
          <input name="title" className="input" required defaultValue={collection.title} />
        </label>
        <label className="block">
          <span className="label">Slug</span>
          <input name="slug" className="input" required defaultValue={collection.slug} />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Description</span>
          <textarea
            name="description"
            className="input"
            rows={3}
            defaultValue={collection.description || ""}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label">Hero image URL</span>
          <input name="imageUrl" className="input" defaultValue={collection.imageUrl || ""} />
        </label>
        <label className="block">
          <span className="label">Sort order</span>
          <input
            name="sortOrder"
            type="number"
            className="input"
            defaultValue={collection.sortOrder}
          />
        </label>
        <div className="flex items-end gap-4 pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={collection.published} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={collection.isFeatured} />
            Featured
          </label>
        </div>
        <label className="block">
          <span className="label">SEO title</span>
          <input name="seoTitle" className="input" defaultValue={collection.seoTitle || ""} />
        </label>
        <label className="block">
          <span className="label">SEO description</span>
          <input name="seoDesc" className="input" defaultValue={collection.seoDesc || ""} />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-medium">Products ({selected.length})</h2>
          <input
            className="input max-w-xs"
            placeholder="Filter products…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="border border-[color:var(--line)] max-h-80 overflow-auto bg-white/70">
          {filtered.map((p) => (
            <label
              key={p.id}
              className="flex items-start gap-2 px-3 py-2 text-sm border-b border-[color:var(--line)] last:border-0"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span>
                <span className="font-medium">{p.title}</span>
                <span className="block text-xs text-muted">{p.slug}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save collection"}
      </button>
    </form>
  );
}
