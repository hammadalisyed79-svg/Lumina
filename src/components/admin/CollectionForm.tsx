"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CollectionCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        slug: fd.get("slug") || undefined,
        description: fd.get("description") || undefined,
        published: fd.get("published") === "on",
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
      <p className="text-sm font-medium">Add collection</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="title" required placeholder="Title" className="input" />
        <input name="slug" placeholder="Slug (optional)" className="input" />
        <input name="description" placeholder="Description" className="input sm:col-span-2" />
        <input name="sortOrder" type="number" placeholder="Sort order" className="input" defaultValue="0" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" />
          Published
        </label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary">
        Create collection
      </button>
    </form>
  );
}

export function CollectionPublishedToggle({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/admin/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    router.refresh();
  }

  return (
    <button type="button" className="text-xs underline" onClick={toggle}>
      {published ? "Unpublish" : "Publish"}
    </button>
  );
}
