"use client";

import { useRouter } from "next/navigation";

export function ReviewModeration({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function setStatus(next: "APPROVED" | "REJECTED" | "PENDING") {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 text-xs shrink-0">
      {status !== "APPROVED" && (
        <button type="button" className="btn-secondary py-1 px-3" onClick={() => setStatus("APPROVED")}>
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button type="button" className="underline" onClick={() => setStatus("REJECTED")}>
          Reject
        </button>
      )}
    </div>
  );
}
