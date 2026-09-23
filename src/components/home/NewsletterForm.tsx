"use client";

import { useState } from "react";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("err");
      setMessage(data.error || "Something went wrong");
      return;
    }
    setStatus("ok");
    setMessage("Welcome — you’ll hear from us soon.");
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className={
            dark
              ? "input flex-1 border-white/20 bg-white/5 text-ivory placeholder:text-ivory/40 focus:border-champagne"
              : "input flex-1"
          }
        />
        <button type="submit" className="btn-primary whitespace-nowrap shrink-0">
          Join
        </button>
      </div>
      {message && (
        <p
          className={`text-sm ${
            status === "err"
              ? "text-red-600"
              : dark
                ? "text-ivory/60"
                : "text-muted"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
