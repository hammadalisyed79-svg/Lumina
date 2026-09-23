"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductCreateForm({ fabrics }: { fabrics: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        slug: fd.get("slug"),
        description: fd.get("description"),
        type: fd.get("type"),
        basePrice: Number(fd.get("basePrice")),
        fabricId: fd.get("fabricId") || undefined,
        published: fd.get("published") === "on",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <input name="title" required placeholder="Title" className="input" />
      <input name="slug" required placeholder="slug-example" className="input" />
      <textarea name="description" required rows={5} placeholder="Description" className="input" />
      <select name="type" className="input" defaultValue="LAMPSHADE">
        <option value="LAMPSHADE">Lampshade</option>
        <option value="FABRIC">Fabric</option>
        <option value="CUSHION">Cushion</option>
        <option value="KIT">Kit</option>
      </select>
      <input name="basePrice" type="number" step="0.01" required placeholder="Base price" className="input" />
      <select name="fabricId" className="input">
        <option value="">No fabric</option>
        {fabrics.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked />
        Published
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary">
        Create product
      </button>
    </form>
  );
}
