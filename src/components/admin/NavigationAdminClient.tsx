"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  enabled: boolean;
};

export function NavigationAdminClient({
  menuId,
  items,
}: {
  menuId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [message, setMessage] = useState("");

  async function save(item: Item) {
    const res = await fetch(`/api/admin/navigation/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setMessage(res.ok ? "Saved" : "Failed");
    router.refresh();
  }

  async function add() {
    const res = await fetch("/api/admin/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuId,
        label: "New link",
        url: "/",
        sortOrder: rows.length,
        enabled: true,
      }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {rows.map((row, idx) => (
        <div key={row.id} className="grid md:grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-center">
          <input
            className="input"
            value={row.label}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, label: e.target.value };
              setRows(next);
            }}
          />
          <input
            className="input"
            value={row.url}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, url: e.target.value };
              setRows(next);
            }}
          />
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, enabled: e.target.checked };
                setRows(next);
              }}
            />
            On
          </label>
          <button type="button" className="btn-secondary text-sm" onClick={() => save(rows[idx])}>
            Save
          </button>
        </div>
      ))}
      <button type="button" className="btn-primary" onClick={add}>
        Add link
      </button>
      {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
    </div>
  );
}
