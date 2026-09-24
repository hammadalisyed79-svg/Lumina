"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fdChecked, fdNum, fdNumOrNull, fdStr } from "@/components/admin/form-helpers";

export type ShapeOption = { id: string; name: string; key: string };

export type SizeRow = {
  id: string;
  name: string;
  slug: string;
  shapeId: string | null;
  shapeName: string | null;
  diameterCm: string | null;
  heightCm: string | null;
  widthCm: string | null;
  depthCm: string | null;
  displayUnit: string;
  priceMod: string;
  active: boolean;
  sortOrder: number;
};

function sizePayload(fd: FormData) {
  const shapeId = fdStr(fd, "shapeId");
  return {
    name: fdStr(fd, "name"),
    slug: fdStr(fd, "slug") || undefined,
    shapeId: shapeId || null,
    diameterCm: fdNumOrNull(fd, "diameterCm"),
    heightCm: fdNumOrNull(fd, "heightCm"),
    widthCm: fdNumOrNull(fd, "widthCm"),
    depthCm: fdNumOrNull(fd, "depthCm"),
    displayUnit: fdStr(fd, "displayUnit") || "cm",
    priceMod: fdNum(fd, "priceMod"),
    active: fdChecked(fd, "active"),
    sortOrder: fdNum(fd, "sortOrder"),
  };
}

export function SizeCreateForm({ shapes }: { shapes: ShapeOption[] }) {
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
    const body = sizePayload(fd);
    const res = await fetch("/api/admin/sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setMessage("Size created");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-4">
      <h2 className="admin-h2">Add size</h2>
      <SizeFields shapes={shapes} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Create size"}
        </button>
      </div>
    </form>
  );
}

export function SizeEditForm({
  size,
  shapes,
}: {
  size: SizeRow;
  shapes: ShapeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/sizes/${size.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sizePayload(fd)),
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
    <form onSubmit={onSubmit} className="admin-panel space-y-3 min-w-[320px]">
      <SizeFields shapes={shapes} size={size} />
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

function SizeFields({
  shapes,
  size,
}: {
  shapes: ShapeOption[];
  size?: SizeRow;
}) {
  return (
    <div className="admin-form-grid cols-2">
      <label>
        <span className="admin-label">Name</span>
        <input name="name" required defaultValue={size?.name} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Slug</span>
        <input
          name="slug"
          defaultValue={size?.slug}
          placeholder="auto from name"
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Shape</span>
        <select name="shapeId" defaultValue={size?.shapeId ?? ""} className="admin-input">
          <option value="">Any / universal</option>
          {shapes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.key})
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="admin-label">Display unit</span>
        <input
          name="displayUnit"
          defaultValue={size?.displayUnit ?? "cm"}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Diameter (cm)</span>
        <input
          name="diameterCm"
          type="number"
          step="0.01"
          defaultValue={size?.diameterCm ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Height (cm)</span>
        <input
          name="heightCm"
          type="number"
          step="0.01"
          defaultValue={size?.heightCm ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Width (cm)</span>
        <input
          name="widthCm"
          type="number"
          step="0.01"
          defaultValue={size?.widthCm ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Depth (cm)</span>
        <input
          name="depthCm"
          type="number"
          step="0.01"
          defaultValue={size?.depthCm ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Price mod (£)</span>
        <input
          name="priceMod"
          type="number"
          step="0.01"
          defaultValue={size?.priceMod ?? "0"}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Sort order</span>
        <input
          name="sortOrder"
          type="number"
          defaultValue={size?.sortOrder ?? 0}
          className="admin-input"
        />
      </label>
      <label className="flex items-center gap-2 text-sm pt-6">
        <input type="checkbox" name="active" defaultChecked={size?.active ?? true} />
        Active
      </label>
    </div>
  );
}
