"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/admin/orders";

export function OrderStatusForm({
  id,
  status,
  paymentStatus,
}: {
  id: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: fd.get("status"),
        paymentStatus: fd.get("paymentStatus"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={save} className="admin-actions text-xs">
      <select name="status" defaultValue={status} className="admin-input" style={{ width: "auto" }}>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        name="paymentStatus"
        defaultValue={paymentStatus}
        className="admin-input"
        style={{ width: "auto" }}
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-secondary py-1 px-3 text-xs" disabled={loading}>
        {loading ? "…" : "Update"}
      </button>
      {error && <span className="text-red-700">{error}</span>}
    </form>
  );
}
