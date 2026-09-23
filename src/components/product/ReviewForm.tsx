"use client";

import { useState } from "react";
import { MediaImage } from "@/components/media/MediaImage";

export function ReviewForm({ productId }: { productId: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3 - imageUrls.length);
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    const next = [...imageUrls];
    for (const file of files) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/reviews/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) next.push(data.url);
    }
    setImageUrls(next.slice(0, 3));
    setUploading(false);
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        author: fd.get("author"),
        email: fd.get("email"),
        rating: Number(fd.get("rating")),
        title: fd.get("title"),
        body: fd.get("body"),
        imageUrls,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("err");
      setMessage(data.error || "Unable to submit");
      return;
    }
    setStatus("ok");
    setMessage(
      data.verifiedPurchase
        ? "Thank you — verified purchase noted. Your review awaits moderation."
        : "Thank you — your review awaits moderation."
    );
    setImageUrls([]);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-lg border border-line p-5 bg-white/50">
      <p className="font-medium">Write a review</p>
      <p className="text-xs text-muted leading-relaxed">
        Bought this piece? Use the email on your order — we mark verified purchases automatically.
      </p>
      <input name="author" required placeholder="Name" className="input" />
      <input name="email" type="email" placeholder="Order email (for verification)" className="input" />
      <select name="rating" className="input" defaultValue="5">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} stars
          </option>
        ))}
      </select>
      <input name="title" placeholder="Title" className="input" />
      <textarea name="body" required rows={4} placeholder="Your experience" className="input" />

      <div>
        <label className="block text-sm mb-2">
          Photos <span className="text-muted">(optional, up to 3)</span>
        </label>
        {imageUrls.length > 0 && (
          <div className="flex gap-2 mb-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative w-16 h-16 overflow-hidden bg-stone">
                <MediaImage src={url} alt="" fill className="object-cover" sizes="64px" />
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 bg-charcoal/80 text-ivory text-[10px] px-1"
                  onClick={() => setImageUrls((u) => u.filter((x) => x !== url))}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {imageUrls.length < 3 && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotos}
            disabled={uploading}
            className="text-sm"
          />
        )}
        {uploading && <p className="text-xs text-muted mt-1">Uploading…</p>}
      </div>

      <button type="submit" className="btn-secondary" disabled={uploading}>
        Submit review
      </button>
      {message && (
        <p className={`text-sm ${status === "err" ? "text-red-700" : "text-muted"}`}>{message}</p>
      )}
    </form>
  );
}
