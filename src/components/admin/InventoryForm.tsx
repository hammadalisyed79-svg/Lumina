"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  kind: string;
  available: number;
  reserved: number;
  reorderLevel: number;
  trackStock: boolean;
};

export function InventoryCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: fd.get("sku"),
        name: fd.get("name"),
        kind: fd.get("kind"),
        available: Number(fd.get("available") || 0),
        reorderLevel: Number(fd.get("reorderLevel") || 0),
        trackStock: fd.get("trackStock") === "on",
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
    <form onSubmit={onSubmit} className="space-y-3 border border-[color:var(--line)] bg-white/70 p-4 mb-8">
      <p className="text-sm font-medium">Add inventory item</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="sku" required placeholder="SKU" className="input" />
        <input name="name" required placeholder="Name" className="input" />
        <select name="kind" className="input" defaultValue="OTHER">
          <option value="FINISHED">Finished</option>
          <option value="KIT">Kit</option>
          <option value="FABRIC">Fabric</option>
          <option value="COMPONENT">Component</option>
          <option value="OTHER">Other</option>
        </select>
        <input name="available" type="number" min="0" placeholder="Available" className="input" defaultValue="0" />
        <input name="reorderLevel" type="number" min="0" placeholder="Reorder level" className="input" defaultValue="0" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="trackStock" defaultChecked />
          Track stock
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary">
        Create item
      </button>
    </form>
  );
}

export function InventoryAdjustForm({ item }: { item: InventoryRow }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function adjust(delta: number) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustBy: delta, reason: "manual_adjustment" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.refresh();
  }

  async function onSet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        available: Number(fd.get("available")),
        reason: "manual_set",
        note: (fd.get("note") as string) || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-xs border border-[color:var(--line)] px-2 py-1"
          disabled={loading}
          onClick={() => adjust(-1)}
        >
          −1
        </button>
        <button
          type="button"
          className="text-xs border border-[color:var(--line)] px-2 py-1"
          disabled={loading}
          onClick={() => adjust(1)}
        >
          +1
        </button>
        <form onSubmit={onSet} className="flex items-center gap-1">
          <input
            name="available"
            type="number"
            min="0"
            defaultValue={item.available}
            className="input w-20 text-xs py-1"
          />
          <input name="note" placeholder="Note" className="input w-24 text-xs py-1" />
          <button type="submit" className="text-xs underline" disabled={loading}>
            Set
          </button>
        </form>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
