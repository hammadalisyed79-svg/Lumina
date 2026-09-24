"use client";

import { useRouter } from "next/navigation";

export function AdminProductActions({
  id,
  published,
  archived,
}: {
  id: string;
  published: boolean;
  archived?: boolean;
}) {
  const router = useRouter();

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  return (
    <span className="inline-flex gap-2 text-xs">
      <button type="button" className="underline" onClick={() => patch({ published: !published })}>
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        className="underline"
        onClick={() =>
          patch({
            archived: !archived,
            published: archived ? published : false,
            migrationStatus: !archived ? "ARCHIVED" : "IMPORTED",
          })
        }
      >
        {archived ? "Unarchive" : "Archive"}
      </button>
    </span>
  );
}
