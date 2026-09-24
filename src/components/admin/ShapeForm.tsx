"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fdChecked, fdNum, fdStr } from "@/components/admin/form-helpers";

export type ShapeRow = {
  id: string;
  name: string;
  key: string;
  basePrice: string;
  priceMod: string;
  active: boolean;
  sortOrder: number;
  imageUrl: string | null;
  description: string | null;
};

export function ShapeCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/shapes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fdStr(fd, "name"),
        key: fdStr(fd, "key") || undefined,
        basePrice: fdNum(fd, "basePrice"),
        priceMod: fdNum(fd, "priceMod"),
        active: fdChecked(fd, "active"),
        sortOrder: fdNum(fd, "sortOrder"),
        imageUrl: fdStr(fd, "imageUrl") || undefined,
        description: fdStr(fd, "description") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setMessage("Shape created");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-4">
      <h2 className="admin-h2">Add shape</h2>
      <div className="admin-form-grid cols-2">
        <label>
          <span className="admin-label">Name</span>
          <input name="name" required className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Key (optional)</span>
          <input name="key" className="admin-input" placeholder="auto from name" />
        </label>
        <label>
          <span className="admin-label">Base price (£)</span>
          <input name="basePrice" type="number" step="0.01" required className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Price mod (£)</span>
          <input name="priceMod" type="number" step="0.01" defaultValue="0" className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Sort order</span>
          <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Image URL</span>
          <input name="imageUrl" className="admin-input" placeholder="/media/…" />
        </label>
        <label className="sm:col-span-2">
          <span className="admin-label">Description</span>
          <textarea name="description" rows={2} className="admin-input" />
        </label>
        <label className="flex items-center gap-2 text-sm pt-6">
          <input type="checkbox" name="active" defaultChecked />
          Active
        </label>
      </div>
      <p className="text-xs text-[color:var(--admin-muted)]">
        Tip: pick imagery from the{" "}
        <Link href="/admin/media" className="underline">
          media library
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Create shape"}
        </button>
      </div>
    </form>
  );
}

export function ShapeEditForm({ shape }: { shape: ShapeRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/shapes/${shape.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fdStr(fd, "name"),
        key: fdStr(fd, "key"),
        basePrice: fdNum(fd, "basePrice"),
        priceMod: fdNum(fd, "priceMod"),
        active: fdChecked(fd, "active"),
        sortOrder: fdNum(fd, "sortOrder"),
        imageUrl: fdStr(fd, "imageUrl") || null,
        description: fdStr(fd, "description") || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="text-xs underline" onClick={() => setOpen(true)}>
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-3 min-w-[300px]">
      <div className="admin-form-grid cols-2">
        <label>
          <span className="admin-label">Name</span>
          <input name="name" required defaultValue={shape.name} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Key</span>
          <input name="key" required defaultValue={shape.key} className="admin-input" />
        </label>
        <label>
          <span className="admin-label">Base price</span>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            required
            defaultValue={shape.basePrice}
            className="admin-input"
          />
        </label>
        <label>
          <span className="admin-label">Price mod</span>
          <input
            name="priceMod"
            type="number"
            step="0.01"
            defaultValue={shape.priceMod}
            className="admin-input"
          />
        </label>
        <label>
          <span className="admin-label">Sort</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={shape.sortOrder}
            className="admin-input"
          />
        </label>
        <label>
          <span className="admin-label">Image URL</span>
          <input
            name="imageUrl"
            defaultValue={shape.imageUrl ?? ""}
            className="admin-input"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="admin-label">Description</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={shape.description ?? ""}
            className="admin-input"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={shape.active} />
          Active
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn-quiet text-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
