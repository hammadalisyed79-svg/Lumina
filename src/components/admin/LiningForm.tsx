"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fdChecked, fdNum, fdStr } from "@/components/admin/form-helpers";

export type LiningRow = {
  id: string;
  name: string;
  slug: string;
  colour: string | null;
  swatchUrl: string | null;
  description: string | null;
  priceMod: string;
  active: boolean;
  sortOrder: number;
};

function liningPayload(fd: FormData) {
  return {
    name: fdStr(fd, "name"),
    slug: fdStr(fd, "slug") || undefined,
    colour: fdStr(fd, "colour") || null,
    swatchUrl: fdStr(fd, "swatchUrl") || null,
    description: fdStr(fd, "description") || null,
    priceMod: fdNum(fd, "priceMod"),
    active: fdChecked(fd, "active"),
    sortOrder: fdNum(fd, "sortOrder"),
  };
}

export function LiningCreateForm() {
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
    const body = liningPayload(fd);
    const res = await fetch("/api/admin/linings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        colour: body.colour || undefined,
        swatchUrl: body.swatchUrl || undefined,
        description: body.description || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setMessage("Lining created");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-4">
      <h2 className="admin-h2">Add lining</h2>
      <LiningFields />
      <p className="text-xs text-[color:var(--admin-muted)]">
        Swatch URLs from the{" "}
        <Link href="/admin/media" className="underline">
          media library
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Create lining"}
        </button>
      </div>
    </form>
  );
}

export function LiningEditForm({ lining }: { lining: LiningRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/linings/${lining.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(liningPayload(fd)),
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
      <LiningFields lining={lining} />
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

function LiningFields({ lining }: { lining?: LiningRow }) {
  return (
    <div className="admin-form-grid cols-2">
      <label>
        <span className="admin-label">Name</span>
        <input name="name" required defaultValue={lining?.name} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Slug</span>
        <input
          name="slug"
          defaultValue={lining?.slug}
          placeholder="auto from name"
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Colour</span>
        <input name="colour" defaultValue={lining?.colour ?? ""} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Price mod (£)</span>
        <input
          name="priceMod"
          type="number"
          step="0.01"
          defaultValue={lining?.priceMod ?? "0"}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Sort order</span>
        <input
          name="sortOrder"
          type="number"
          defaultValue={lining?.sortOrder ?? 0}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Swatch URL</span>
        <input name="swatchUrl" defaultValue={lining?.swatchUrl ?? ""} className="admin-input" />
      </label>
      <label className="sm:col-span-2">
        <span className="admin-label">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={lining?.description ?? ""}
          className="admin-input"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={lining?.active ?? true} />
        Active
      </label>
    </div>
  );
}
