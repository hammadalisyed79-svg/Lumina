"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Section = {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  enabled: boolean;
};

export function HomepageSectionEditor({ sections }: { sections: Section[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(sections);
  const [message, setMessage] = useState("");

  async function save(row: Section) {
    setMessage("");
    const res = await fetch(`/api/admin/homepage/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      setMessage("Save failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {rows.map((row, idx) => (
        <div key={row.id} className="border border-[color:var(--line)] p-4 bg-white/70 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">
              {row.type} <span className="text-[color:var(--muted)]">#{row.sortOrder}</span>
            </p>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...row, enabled: e.target.checked };
                  setRows(next);
                }}
              />
              Enabled
            </label>
          </div>
          <input
            className="input"
            placeholder="Title"
            value={row.title || ""}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, title: e.target.value };
              setRows(next);
            }}
          />
          <input
            className="input"
            placeholder="Subtitle"
            value={row.subtitle || ""}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, subtitle: e.target.value };
              setRows(next);
            }}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Body"
            value={row.body || ""}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, body: e.target.value };
              setRows(next);
            }}
          />
          <input
            className="input"
            placeholder="Image URL"
            value={row.imageUrl || ""}
            onChange={(e) => {
              const next = [...rows];
              next[idx] = { ...row, imageUrl: e.target.value };
              setRows(next);
            }}
          />
          <div className="grid md:grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="CTA label"
              value={row.ctaLabel || ""}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, ctaLabel: e.target.value };
                setRows(next);
              }}
            />
            <input
              className="input"
              placeholder="CTA href"
              value={row.ctaHref || ""}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, ctaHref: e.target.value };
                setRows(next);
              }}
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => save(rows[idx])}>
            Save section
          </button>
        </div>
      ))}
      {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
    </div>
  );
}
