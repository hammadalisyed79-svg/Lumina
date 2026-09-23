"use client";

import { useRouter } from "next/navigation";

export function AdminProductActions({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/admin/products/${id}`, {
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
