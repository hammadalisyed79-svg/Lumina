"use client";

import { useState } from "react";

export function ReviewForm({ productId }: { productId: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

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
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("err");
      setMessage(data.error || "Unable to submit");
      return;
    }
    setStatus("ok");
    setMessage("Thank you — your review awaits moderation.");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-lg border border-[color:var(--line)] p-5 bg-white/50">
      <p className="font-medium">Write a review</p>
      <input name="author" required placeholder="Name" className="input" />
      <input name="email" type="email" placeholder="Email (optional)" className="input" />
      <select name="rating" className="input" defaultValue="5">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} stars
          </option>
        ))}
      </select>
      <input name="title" placeholder="Title" className="input" />
      <textarea name="body" required rows={4} placeholder="Your experience" className="input" />
      <button type="submit" className="btn-secondary">
        Submit review
      </button>
      {message && (
        <p className={`text-sm ${status === "err" ? "text-red-700" : "text-[color:var(--muted)]"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
