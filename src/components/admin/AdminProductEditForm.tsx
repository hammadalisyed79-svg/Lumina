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
    archived: boolean;
    featured: boolean;
    bestseller: boolean;
    leadTimeDays: number;
    shopifyProductId: string | null;
    shopifyHandle: string | null;
    seoTitle: string | null;
    seoDesc: string | null;
    shapeKey: string | null;
    sourceTitle: string | null;
    sourceUrl: string | null;
    migrationStatus: string | null;
    adminFieldsLocked: boolean;
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
    product.images.length ? product.images : [{ url: "", alt: "", sortOrder: 0 }]
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
      archived: fd.get("archived") === "on",
      featured: fd.get("featured") === "on",
      bestseller: fd.get("bestseller") === "on",
      leadTimeDays: Number(fd.get("leadTimeDays") || product.leadTimeDays || 7),
      adminFieldsLocked: fd.get("adminFieldsLocked") === "on",
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
    <form onSubmit={onSubmit} className="space-y-4 max-w-5xl">
      <div className="admin-panel">
        <h2 className="admin-h2">Core</h2>
        <div className="admin-form-grid cols-2">
          <label className="block" style={{ gridColumn: "1 / -1" }}>
            <span className="admin-label">Title</span>
            <input name="title" required defaultValue={product.title} className="admin-input" />
          </label>
          <label className="block">
            <span className="admin-label">Slug</span>
            <input name="slug" required defaultValue={product.slug} className="admin-input" />
          </label>
          <label className="block">
            <span className="admin-label">Base price (£)</span>
            <input
              name="basePrice"
              type="number"
              step="0.01"
              required
              defaultValue={product.basePrice}
              className="admin-input"
            />
          </label>
          <label className="block" style={{ gridColumn: "1 / -1" }}>
            <span className="admin-label">Subtitle</span>
            <input name="subtitle" defaultValue={product.subtitle || ""} className="admin-input" />
          </label>
          <label className="block" style={{ gridColumn: "1 / -1" }}>
            <span className="admin-label">Short description</span>
            <input name="shortDesc" defaultValue={product.shortDesc || ""} className="admin-input" />
          </label>
          <label className="block" style={{ gridColumn: "1 / -1" }}>
            <span className="admin-label">Description</span>
            <textarea
              name="description"
              required
              rows={6}
              defaultValue={product.description}
              className="admin-input"
            />
          </label>
          <label className="block">
            <span className="admin-label">Shape key</span>
            <input name="shapeKey" defaultValue={product.shapeKey || ""} className="admin-input" />
          </label>
          <label className="block">
            <span className="admin-label">Lead time (days)</span>
            <input
              name="leadTimeDays"
              type="number"
              min={1}
              max={120}
              defaultValue={product.leadTimeDays}
              className="admin-input"
            />
          </label>
        </div>
        <div className="admin-actions mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input name="published" type="checkbox" defaultChecked={product.published} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="archived" type="checkbox" defaultChecked={product.archived} />
            Archived
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="featured" type="checkbox" defaultChecked={product.featured} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="bestseller" type="checkbox" defaultChecked={product.bestseller} />
            Bestseller
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="adminFieldsLocked"
              type="checkbox"
              defaultChecked={product.adminFieldsLocked}
            />
            Lock customer fields (skip on re-import)
          </label>
        </div>
        {(product.sourceTitle || product.sourceUrl) && (
          <div className="mt-4 text-sm admin-muted space-y-1">
            <p>
              <span className="uppercase tracking-wide text-[10px]">Source title</span>
              <br />
              {product.sourceTitle}
            </p>
            {product.sourceUrl && (
              <p>
                <a href={product.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                  Open source product
                </a>
                {product.migrationStatus ? ` · ${product.migrationStatus}` : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="admin-panel">
        <h2 className="admin-h2">SEO & legacy IDs</h2>
        <div className="admin-form-grid cols-2">
          <label className="block">
            <span className="admin-label">SEO title</span>
            <input name="seoTitle" defaultValue={product.seoTitle || ""} className="admin-input" />
          </label>
          <label className="block">
            <span className="admin-label">Shopify product ID</span>
            <input
              name="shopifyProductId"
              defaultValue={product.shopifyProductId || ""}
              className="admin-input"
            />
          </label>
          <label className="block" style={{ gridColumn: "1 / -1" }}>
            <span className="admin-label">SEO description</span>
            <input name="seoDesc" defaultValue={product.seoDesc || ""} className="admin-input" />
          </label>
          <label className="block">
            <span className="admin-label">Shopify handle</span>
            <input
              name="shopifyHandle"
              defaultValue={product.shopifyHandle || ""}
              className="admin-input"
            />
          </label>
        </div>
      </div>

      <div className="admin-panel">
        <div className="flex items-center justify-between mb-3">
          <h2 className="admin-h2" style={{ margin: 0 }}>
            Images
          </h2>
          <div className="admin-actions">
            <a href="/admin/media" className="admin-filter-chip">
              Open media library
            </a>
            <button
              type="button"
              className="admin-filter-chip"
              onClick={() =>
                setImages((prev) => [...prev, { url: "", alt: "", sortOrder: prev.length }])
              }
            >
              Add image
            </button>
          </div>
        </div>
        <p className="admin-muted mb-3 text-sm">
          Paste a `/media/…` URL from the media library. Alt text is used for accessibility and SEO.
        </p>
        <div className="space-y-3">
          {images.map((img, idx) => (
            <div key={idx} className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                className="admin-input"
                placeholder="/media/products/…"
                value={img.url}
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = { ...img, url: e.target.value };
                  setImages(next);
                }}
              />
              <input
                className="admin-input"
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
      </div>

      <div className="admin-panel">
        <h2 className="admin-h2">
          Variants ({variants.length}
          {variants.length > 40 ? " — first 40 editable" : ""})
        </h2>
        <div className="admin-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>SKU</th>
                <th>Price override</th>
                <th>Shopify variant</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {variants.slice(0, 40).map((v) => (
                <tr key={v.id}>
                  <td>
                    <input
                      className="admin-input"
                      value={v.title}
                      onChange={(e) => {
                        setVariants((prev) =>
                          prev.map((row) =>
                            row.id === v.id ? { ...row, title: e.target.value } : row
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input"
                      value={v.sku}
                      onChange={(e) => {
                        setVariants((prev) =>
                          prev.map((row) =>
                            row.id === v.id ? { ...row, sku: e.target.value } : row
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input"
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
                  </td>
                  <td>
                    <input
                      className="admin-input"
                      placeholder="Variant ID"
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
                  </td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="admin-muted text-sm">{message}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
