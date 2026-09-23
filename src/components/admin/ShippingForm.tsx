"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ShippingRow = {
  id: string;
  name: string;
  calcType: string;
  price: string;
  freeAbove: string | null;
  estimatedDays: string | null;
  active: boolean;
  sortOrder: number;
};

export function ShippingCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const freeAboveRaw = fd.get("freeAbove");
    const res = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        calcType: fd.get("calcType"),
        price: Number(fd.get("price")),
        freeAbove: freeAboveRaw ? Number(freeAboveRaw) : null,
        estimatedDays: fd.get("estimatedDays") || undefined,
        active: fd.get("active") === "on",
        sortOrder: Number(fd.get("sortOrder") || 0),
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
      <p className="text-sm font-medium">Add shipping method</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="name" required placeholder="Name" className="input" />
        <select name="calcType" className="input" defaultValue="FLAT">
          <option value="FLAT">Flat</option>
          <option value="FREE_ABOVE">Free above</option>
          <option value="WEIGHT">Weight</option>
        </select>
        <input name="price" type="number" step="0.01" required placeholder="Price" className="input" />
        <input name="freeAbove" type="number" step="0.01" placeholder="Free above" className="input" />
        <input name="estimatedDays" placeholder="Est. days (e.g. 3-5)" className="input" />
        <input name="sortOrder" type="number" placeholder="Sort order" className="input" defaultValue="0" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Active
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary">
        Create method
      </button>
    </form>
  );
}

export function ShippingEditForm({ method }: { method: ShippingRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const freeAboveRaw = fd.get("freeAbove");
    const res = await fetch(`/api/admin/shipping/${method.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        calcType: fd.get("calcType"),
        price: Number(fd.get("price")),
        freeAbove: freeAboveRaw ? Number(freeAboveRaw) : null,
        estimatedDays: (fd.get("estimatedDays") as string) || null,
        active: fd.get("active") === "on",
        sortOrder: Number(fd.get("sortOrder")),
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
      <input name="name" required defaultValue={method.name} className="input" />
      <select name="calcType" className="input" defaultValue={method.calcType}>
        <option value="FLAT">Flat</option>
        <option value="FREE_ABOVE">Free above</option>
        <option value="WEIGHT">Weight</option>
      </select>
      <input name="price" type="number" step="0.01" required defaultValue={method.price} className="input" />
      <input
        name="freeAbove"
        type="number"
        step="0.01"
        defaultValue={method.freeAbove ?? ""}
        placeholder="Free above"
        className="input"
      />
      <input
        name="estimatedDays"
        defaultValue={method.estimatedDays ?? ""}
        placeholder="Est. days"
        className="input"
      />
      <input name="sortOrder" type="number" defaultValue={method.sortOrder} className="input" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={method.active} />
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
