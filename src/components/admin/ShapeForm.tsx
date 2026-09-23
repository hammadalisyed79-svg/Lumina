"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ShapeRow = {
  id: string;
  name: string;
  key: string;
  basePrice: string;
  priceMod: string;
  active: boolean;
  sortOrder: number;
  imageUrl: string | null;
};

export function ShapeCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/shapes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        key: fd.get("key") || undefined,
        basePrice: Number(fd.get("basePrice")),
        priceMod: Number(fd.get("priceMod") || 0),
        active: fd.get("active") === "on",
        sortOrder: Number(fd.get("sortOrder") || 0),
        imageUrl: fd.get("imageUrl") || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setError("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-[color:var(--line)] bg-white/70 p-4">
      <p className="text-sm font-medium">Add shape</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="name" required placeholder="Name" className="input" />
        <input name="key" placeholder="Key (optional)" className="input" />
        <input name="basePrice" type="number" step="0.01" required placeholder="Base price" className="input" />
        <input name="priceMod" type="number" step="0.01" placeholder="Price mod" className="input" defaultValue="0" />
        <input name="sortOrder" type="number" placeholder="Sort order" className="input" defaultValue="0" />
        <input name="imageUrl" placeholder="Image URL" className="input sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Active
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary">
        Create shape
      </button>
    </form>
  );
}

export function ShapeEditForm({ shape }: { shape: ShapeRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/shapes/${shape.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        key: fd.get("key"),
        basePrice: Number(fd.get("basePrice")),
        priceMod: Number(fd.get("priceMod")),
        active: fd.get("active") === "on",
        sortOrder: Number(fd.get("sortOrder")),
        imageUrl: (fd.get("imageUrl") as string) || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setOpen(false);
    setError("");
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
    <form onSubmit={onSubmit} className="space-y-2 min-w-[280px]">
      <input name="name" required defaultValue={shape.name} className="input" />
      <input name="key" required defaultValue={shape.key} className="input" />
      <input name="basePrice" type="number" step="0.01" required defaultValue={shape.basePrice} className="input" />
      <input name="priceMod" type="number" step="0.01" defaultValue={shape.priceMod} className="input" />
      <input name="sortOrder" type="number" defaultValue={shape.sortOrder} className="input" />
      <input name="imageUrl" defaultValue={shape.imageUrl ?? ""} placeholder="Image URL" className="input" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={shape.active} />
        Active
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-xs px-3 py-1">
          Save
        </button>
        <button type="button" className="text-xs underline" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
