"use client";

import { useState } from "react";

export function SeoSettingsForm({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        description: fd.get("description"),
      }),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <label className="block">
        <span className="label">Default title</span>
        <input name="title" defaultValue={title} className="input" />
      </label>
      <label className="block">
        <span className="label">Default description</span>
        <textarea name="description" defaultValue={description} rows={4} className="input" />
      </label>
      <button type="submit" className="btn-secondary">
        Save SEO defaults
      </button>
      {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
    </form>
  );
}
