"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImageRow = { id?: string; url: string; alt: string; sortOrder: number };
type VariantRow = {
  id: string;
  title: string;
  sku: string;
  priceOverride: string;
  shopifyVariantId: string;
  active: boolean;
};

type Props = {
  product: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    description: string;
    shortDesc: string | null;
    basePrice: number;
    published: boolean;
    featured: boolean;
    bestseller: boolean;
    shopifyProductId: string | null;
    shopifyHandle: string | null;
    seoTitle: string | null;
    seoDesc: string | null;
    shapeKey: string | null;
    images: ImageRow[];
    variants: VariantRow[];
  };
};

export function AdminProductEditForm({ product }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState(
    product.images.length
      ? product.images
      : [{ url: "", alt: "", sortOrder: 0 }]
  );
  const [variants, setVariants] = useState(product.variants);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      slug: String(fd.get("slug")),
      subtitle: String(fd.get("subtitle") || "") || null,
      description: String(fd.get("description")),
      shortDesc: String(fd.get("shortDesc") || "") || null,
      basePrice: Number(fd.get("basePrice")),
      published: fd.get("published") === "on",
      featured: fd.get("featured") === "on",
      bestseller: fd.get("bestseller") === "on",
      shopifyProductId: String(fd.get("shopifyProductId") || "") || null,
      shopifyHandle: String(fd.get("shopifyHandle") || "") || null,
      seoTitle: String(fd.get("seoTitle") || "") || null,
      seoDesc: String(fd.get("seoDesc") || "") || null,
      shapeKey: String(fd.get("shapeKey") || "") || null,
      images: images
        .filter((i) => i.url.trim())
        .map((i, idx) => ({
          url: i.url.trim(),
          alt: i.alt || null,
          sortOrder: idx,
        })),
      variants: variants.map((v) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        active: v.active,
        shopifyVariantId: v.shopifyVariantId || null,
        priceOverride: v.priceOverride === "" ? null : Number(v.priceOverride),
      })),
    };

    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="label">Title</span>
          <input name="title" required defaultValue={product.title} className="input" />
        </label>
        <label className="block">
          <span className="label">Slug</span>
          <input name="slug" required defaultValue={product.slug} className="input" />
        </label>
        <label className="block">
          <span className="label">Base price (£)</span>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            required
            defaultValue={product.basePrice}
            className="input"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Subtitle</span>
          <input name="subtitle" defaultValue={product.subtitle || ""} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Short description</span>
          <input name="shortDesc" defaultValue={product.shortDesc || ""} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="label">Description</span>
          <textarea
            name="description"
            required
            rows={6}
            defaultValue={product.description}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">Shape key</span>
          <input name="shapeKey" defaultValue={product.shapeKey || ""} className="input" />
        </label>
        <label className="block">
          <span className="label">Shopify product ID</span>
          <input
            name="shopifyProductId"
            defaultValue={product.shopifyProductId || ""}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">Shopify handle</span>
          <input
            name="shopifyHandle"
            defaultValue={product.shopifyHandle || ""}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">SEO title</span>
          <input name="seoTitle" defaultValue={product.seoTitle || ""} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="label">SEO description</span>
          <input name="seoDesc" defaultValue={product.seoDesc || ""} className="input" />
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input name="published" type="checkbox" defaultChecked={product.published} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="featured" type="checkbox" defaultChecked={product.featured} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="bestseller" type="checkbox" defaultChecked={product.bestseller} />
          Bestseller
        </label>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl">Images</h2>
          <button
            type="button"
            className="text-sm underline"
            onClick={() =>
              setImages((prev) => [...prev, { url: "", alt: "", sortOrder: prev.length }])
            }
          >
            Add image
          </button>
        </div>
        <div className="space-y-3">
          {images.map((img, idx) => (
            <div key={idx} className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                className="input"
                placeholder="/media/products/…"
                value={img.url}
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = { ...img, url: e.target.value };
                  setImages(next);
                }}
              />
              <input
                className="input"
                placeholder="Alt text"
                value={img.alt}
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = { ...img, alt: e.target.value };
                  setImages(next);
                }}
              />
              <button
                type="button"
                className="text-sm text-red-700"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">
          Variants ({variants.length}
          {variants.length > 40 ? " — showing first 40 editable rows" : ""})
        </h2>
        <div className="space-y-2 max-h-[420px] overflow-auto border border-[color:var(--line)] p-3 bg-white/50">
          {variants.slice(0, 40).map((v) => (
            <div
              key={v.id}
              className="grid md:grid-cols-[1.2fr_1fr_0.7fr_1fr_auto] gap-2 items-center text-sm"
            >
              <input
                className="input"
                value={v.title}
                onChange={(e) => {
                  setVariants((prev) =>
                    prev.map((row) =>
                      row.id === v.id ? { ...row, title: e.target.value } : row
                    )
                  );
                }}
              />
              <input
                className="input"
                value={v.sku}
                onChange={(e) => {
                  setVariants((prev) =>
                    prev.map((row) =>
                      row.id === v.id ? { ...row, sku: e.target.value } : row
                    )
                  );
                }}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                value={v.priceOverride}
                onChange={(e) => {
                  setVariants((prev) =>
                    prev.map((row) =>
                      row.id === v.id ? { ...row, priceOverride: e.target.value } : row
                    )
                  );
                }}
              />
              <input
                className="input"
                placeholder="Shopify variant ID"
                value={v.shopifyVariantId}
                onChange={(e) => {
                  setVariants((prev) =>
                    prev.map((row) =>
                      row.id === v.id
                        ? { ...row, shopifyVariantId: e.target.value }
                        : row
                    )
                  );
                }}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={v.active}
                  onChange={(e) => {
                    setVariants((prev) =>
                      prev.map((row) =>
                        row.id === v.id ? { ...row, active: e.target.checked } : row
                      )
                    );
                  }}
                />
                On
              </label>
            </div>
          ))}
        </div>
        {variants.length > 40 && (
          <p className="text-xs text-[color:var(--muted)] mt-2">
            Only the first 40 variants are editable here. Use Shopify sync for bulk updates.
          </p>
        )}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
