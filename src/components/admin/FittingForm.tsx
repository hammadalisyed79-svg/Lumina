"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fdChecked, fdNum, fdStr } from "@/components/admin/form-helpers";

export type FittingRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  compatibility: string | null;
  priceMod: string;
  active: boolean;
  sortOrder: number;
};

function fittingPayload(fd: FormData) {
  return {
    name: fdStr(fd, "name"),
    slug: fdStr(fd, "slug") || undefined,
    description: fdStr(fd, "description") || null,
    imageUrl: fdStr(fd, "imageUrl") || null,
    compatibility: fdStr(fd, "compatibility") || null,
    priceMod: fdNum(fd, "priceMod"),
    active: fdChecked(fd, "active"),
    sortOrder: fdNum(fd, "sortOrder"),
  };
}

export function FittingCreateForm() {
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
    const body = fittingPayload(fd);
    const res = await fetch("/api/admin/fittings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        description: body.description || undefined,
        imageUrl: body.imageUrl || undefined,
        compatibility: body.compatibility || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setMessage("Fitting created");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-4">
      <h2 className="admin-h2">Add fitting</h2>
      <FittingFields />
      <p className="text-xs text-[color:var(--admin-muted)]">
        Image URLs from the{" "}
        <Link href="/admin/media" className="underline">
          media library
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Create fitting"}
        </button>
      </div>
    </form>
  );
}

export function FittingEditForm({ fitting }: { fitting: FittingRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/fittings/${fitting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fittingPayload(fd)),
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
      <FittingFields fitting={fitting} />
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

function FittingFields({ fitting }: { fitting?: FittingRow }) {
  return (
    <div className="admin-form-grid cols-2">
      <label>
        <span className="admin-label">Name</span>
        <input name="name" required defaultValue={fitting?.name} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Slug</span>
        <input
          name="slug"
          defaultValue={fitting?.slug}
          placeholder="auto from name"
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Compatibility</span>
        <input
          name="compatibility"
          defaultValue={fitting?.compatibility ?? ""}
          className="admin-input"
          placeholder="e.g. pendant, table"
        />
      </label>
      <label>
        <span className="admin-label">Price mod (£)</span>
        <input
          name="priceMod"
          type="number"
          step="0.01"
          defaultValue={fitting?.priceMod ?? "0"}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Sort order</span>
        <input
          name="sortOrder"
          type="number"
          defaultValue={fitting?.sortOrder ?? 0}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Image URL</span>
        <input name="imageUrl" defaultValue={fitting?.imageUrl ?? ""} className="admin-input" />
      </label>
      <label className="sm:col-span-2">
        <span className="admin-label">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={fitting?.description ?? ""}
          className="admin-input"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={fitting?.active ?? true} />
        Active
      </label>
    </div>
  );
}
