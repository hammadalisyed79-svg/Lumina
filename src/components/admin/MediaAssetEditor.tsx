"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaAssetEditor({
  id,
  alt,
  caption,
  folder,
  url,
}: {
  id: string;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  url: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alt: String(fd.get("alt") || "") || null,
        caption: String(fd.get("caption") || "") || null,
        folder: String(fd.get("folder") || "") || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy failed");
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={save} className="admin-form-grid cols-2 gap-2">
        <label className="block">
          <span className="admin-label">Alt text</span>
          <input name="alt" defaultValue={alt || ""} className="admin-input" />
        </label>
        <label className="block">
          <span className="admin-label">Folder</span>
          <input name="folder" defaultValue={folder || ""} className="admin-input" />
        </label>
        <label className="block" style={{ gridColumn: "1 / -1" }}>
          <span className="admin-label">Caption</span>
          <input name="caption" defaultValue={caption || ""} className="admin-input" />
        </label>
        <div className="admin-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn-secondary text-xs py-1 px-3" disabled={loading}>
            {loading ? "…" : "Save"}
          </button>
          <button type="button" className="btn-quiet text-xs" onClick={copyUrl}>
            {copied ? "Copied" : "Copy URL"}
          </button>
          {message && <span className="admin-muted text-xs">{message}</span>}
          {error && <span className="text-xs text-red-700">{error}</span>}
        </div>
      </form>
    </div>
  );
}
