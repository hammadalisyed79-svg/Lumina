"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fdChecked, fdNum, fdNumOrNull, fdStr } from "@/components/admin/form-helpers";
import { FabricTexturePreview } from "@/components/admin/FabricTexturePreview";

export type FabricRow = {
  id: string;
  name: string;
  slug: string;
  internalCode: string | null;
  description: string | null;
  colour: string | null;
  material: string | null;
  pattern: string | null;
  imageUrl: string | null;
  swatchUrl: string | null;
  textureImage: string | null;
  patternScale: number;
  patternOffsetX: number;
  patternOffsetY: number;
  patternRotation: number;
  repeatMode: "REPEAT" | "COVER" | "CONTAIN";
  usableAsTexture: boolean;
  priceMod: string;
  stockQty: number | null;
  active: boolean;
  sortOrder: number;
};

function fabricPayload(fd: FormData) {
  return {
    name: fdStr(fd, "name"),
    slug: fdStr(fd, "slug") || undefined,
    internalCode: fdStr(fd, "internalCode") || null,
    description: fdStr(fd, "description") || null,
    colour: fdStr(fd, "colour") || null,
    material: fdStr(fd, "material") || null,
    pattern: fdStr(fd, "pattern") || null,
    imageUrl: fdStr(fd, "imageUrl") || null,
    swatchUrl: fdStr(fd, "swatchUrl") || null,
    textureImage: fdStr(fd, "textureImage") || null,
    patternScale: fdNum(fd, "patternScale") || 1,
    patternOffsetX: fdNum(fd, "patternOffsetX"),
    patternOffsetY: fdNum(fd, "patternOffsetY"),
    patternRotation: fdNum(fd, "patternRotation"),
    repeatMode: (fdStr(fd, "repeatMode") || "REPEAT") as
      | "REPEAT"
      | "COVER"
      | "CONTAIN",
    usableAsTexture: fdChecked(fd, "usableAsTexture"),
    priceMod: fdNum(fd, "priceMod"),
    stockQty: fdNumOrNull(fd, "stockQty"),
    active: fdChecked(fd, "active"),
    sortOrder: fdNum(fd, "sortOrder"),
  };
}

export function FabricCreateForm() {
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
    const body = fabricPayload(fd);
    const res = await fetch("/api/admin/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        slug: body.slug || undefined,
        internalCode: body.internalCode || undefined,
        description: body.description || undefined,
        colour: body.colour || undefined,
        material: body.material || undefined,
        pattern: body.pattern || undefined,
        imageUrl: body.imageUrl || undefined,
        swatchUrl: body.swatchUrl || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    setMessage("Fabric created");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel space-y-4">
      <h2 className="admin-h2">Add fabric</h2>
      <FabricFields />
      <p className="text-xs text-[color:var(--admin-muted)]">
        Swatch &amp; image URLs can come from the{" "}
        <Link href="/admin/media" className="underline">
          media library
        </Link>
        .
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Create fabric"}
        </button>
      </div>
    </form>
  );
}

export function FabricEditForm({ fabric }: { fabric: FabricRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/fabrics/${fabric.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fabricPayload(fd)),
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
      <FabricFields fabric={fabric} />
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

function FabricFields({ fabric }: { fabric?: FabricRow }) {
  return (
    <div className="admin-form-grid cols-2">
      <label>
        <span className="admin-label">Name</span>
        <input name="name" required defaultValue={fabric?.name} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Slug</span>
        <input
          name="slug"
          defaultValue={fabric?.slug}
          placeholder="auto from name"
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Internal code</span>
        <input
          name="internalCode"
          defaultValue={fabric?.internalCode ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Colour</span>
        <input name="colour" defaultValue={fabric?.colour ?? ""} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Material</span>
        <input name="material" defaultValue={fabric?.material ?? ""} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Pattern</span>
        <input name="pattern" defaultValue={fabric?.pattern ?? ""} className="admin-input" />
      </label>
      <label>
        <span className="admin-label">Price mod (£)</span>
        <input
          name="priceMod"
          type="number"
          step="0.01"
          defaultValue={fabric?.priceMod ?? "0"}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Stock qty</span>
        <input
          name="stockQty"
          type="number"
          defaultValue={fabric?.stockQty ?? ""}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Sort order</span>
        <input
          name="sortOrder"
          type="number"
          defaultValue={fabric?.sortOrder ?? 0}
          className="admin-input"
        />
      </label>
      <label>
        <span className="admin-label">Image URL</span>
        <input name="imageUrl" defaultValue={fabric?.imageUrl ?? ""} className="admin-input" />
      </label>
      <label className="sm:col-span-2">
        <span className="admin-label">Swatch URL</span>
        <input name="swatchUrl" defaultValue={fabric?.swatchUrl ?? ""} className="admin-input" />
      </label>
      {fabric ? (
        <FabricTexturePreview
          initial={{
            textureImage: fabric.textureImage || fabric.swatchUrl || "",
            patternScale: fabric.patternScale,
            patternOffsetX: fabric.patternOffsetX,
            patternOffsetY: fabric.patternOffsetY,
            patternRotation: fabric.patternRotation,
            repeatMode: fabric.repeatMode,
            usableAsTexture: fabric.usableAsTexture,
            name: fabric.name,
          }}
        />
      ) : (
        <>
          <label className="sm:col-span-2">
            <span className="admin-label">Texture image URL</span>
            <input name="textureImage" className="admin-input" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="usableAsTexture" />
            Usable as shade texture
          </label>
        </>
      )}
      <label className="sm:col-span-2">
        <span className="admin-label">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={fabric?.description ?? ""}
          className="admin-input"
        />
      </label>
      <label className="flex items-center gap-2 text-sm pt-2">
        <input type="checkbox" name="active" defaultChecked={fabric?.active ?? true} />
        Active
      </label>
    </div>
  );
}
