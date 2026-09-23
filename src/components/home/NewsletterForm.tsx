"use client";

import { useState } from "react";

export function NewsletterForm() {
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
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="input"
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        Subscribe
      </button>
      {message && (
        <p className={`text-sm sm:col-span-2 ${status === "err" ? "text-red-700" : "text-[color:var(--muted)]"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
