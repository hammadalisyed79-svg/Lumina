"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrderNotesForm({
  id,
  staffNotes,
}: {
  id: string;
  staffNotes?: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(staffNotes || "");
  const [append, setAppend] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body: Record<string, string> = { staffNotes: notes };
      if (append.trim()) body.appendNote = append.trim();
      const res = await fetch(`/api/admin/orders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save notes");
        return;
      }
      setAppend("");
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="admin-panel space-y-3">
      <h2 className="admin-h2">Internal notes</h2>
      <textarea
        className="admin-input w-full"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Sticky workshop / fulfilment notes"
      />
      <label className="block text-sm">
        <span className="admin-muted">Append timeline note</span>
        <input
          className="admin-input w-full mt-1"
          value={append}
          onChange={(e) => setAppend(e.target.value)}
          placeholder="Logged to status history"
        />
      </label>
      {error && (
        <p className="text-sm" style={{ color: "var(--admin-danger, #b00)" }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn-secondary text-sm" disabled={loading}>
        {loading ? "Saving…" : "Save notes"}
      </button>
    </form>
  );
}
