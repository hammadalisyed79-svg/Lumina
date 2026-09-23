"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderFulfillmentForm({
  id,
  trackingProvider,
  trackingNumber,
  staffNotes,
  productionStatus,
}: {
  id: string;
  trackingProvider: string | null;
  trackingNumber: string | null;
  staffNotes: string | null;
  productionStatus: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingProvider: String(fd.get("trackingProvider") || "") || null,
        trackingNumber: String(fd.get("trackingNumber") || "") || null,
        staffNotes: String(fd.get("staffNotes") || "") || null,
        productionStatus: String(fd.get("productionStatus")),
        markDispatched: fd.get("markDispatched") === "on",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not save fulfillment");
      return;
    }
    setMessage("Fulfillment saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="admin-panel space-y-3">
      <h2 className="admin-h2">Fulfillment</h2>
      <div className="admin-form-grid cols-2">
        <label className="block">
          <span className="admin-label">Production</span>
          <select
            name="productionStatus"
            defaultValue={productionStatus}
            className="admin-input"
          >
            {["NONE", "QUEUED", "IN_PRODUCTION", "QC", "PACKED", "DISPATCHED", "COMPLETE"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        </label>
        <label className="block">
          <span className="admin-label">Carrier</span>
          <input
            name="trackingProvider"
            defaultValue={trackingProvider || ""}
            className="admin-input"
            placeholder="Royal Mail / DPD…"
          />
        </label>
        <label className="block" style={{ gridColumn: "1 / -1" }}>
          <span className="admin-label">Tracking number</span>
          <input
            name="trackingNumber"
            defaultValue={trackingNumber || ""}
            className="admin-input"
          />
        </label>
        <label className="block" style={{ gridColumn: "1 / -1" }}>
          <span className="admin-label">Staff notes</span>
          <textarea
            name="staffNotes"
            rows={3}
            defaultValue={staffNotes || ""}
            className="admin-input"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="markDispatched" type="checkbox" />
        Set dispatched timestamp now
      </label>
      <div className="admin-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save fulfillment"}
        </button>
        {message && <span className="admin-muted text-sm">{message}</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
