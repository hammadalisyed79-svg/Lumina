"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AddSavedDesignButton } from "@/components/studio/AddSavedDesignButton";
import type { ShadeConfig } from "@/lib/cart/types";

export function SavedDesignActions({
  id,
  name,
  title,
  imageUrl,
  config,
  studioHref,
}: {
  id: string;
  name: string;
  title: string;
  imageUrl?: string | null;
  config: ShadeConfig | null;
  studioHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function remove() {
    if (!confirm("Remove this saved design?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/saved-designs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove.");
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    const next = draft.trim();
    if (!next) {
      setError("Enter a name");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/saved-designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) {
        setError("Could not rename.");
        return;
      }
      setRenaming(false);
      router.refresh();
    } catch {
      setError("Could not rename.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}${studioHref}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-2">
      {renaming ? (
        <div className="flex flex-wrap gap-2">
          <input
            className="input text-sm !py-1.5 max-w-[14rem]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Design name"
          />
          <button
            type="button"
            className="btn-primary text-sm !py-1.5"
            onClick={saveName}
            disabled={busy}
          >
            Save
          </button>
          <button
            type="button"
            className="btn-quiet text-sm"
            onClick={() => {
              setRenaming(false);
              setDraft(name);
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {config && (
          <AddSavedDesignButton title={title} imageUrl={imageUrl} config={config} />
        )}
        <Link href={studioHref} className="btn-secondary text-sm">
          Open studio
        </Link>
        <button type="button" className="btn-quiet text-sm" onClick={share}>
          {copied ? "Link copied" : "Share"}
        </button>
        {!renaming && (
          <button
            type="button"
            className="btn-quiet text-sm"
            onClick={() => setRenaming(true)}
          >
            Rename
          </button>
        )}
        <button
          type="button"
          className="btn-quiet text-sm text-muted"
          onClick={remove}
          disabled={busy}
        >
          Remove
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
