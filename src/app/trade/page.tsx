"use client";

import { useState } from "react";

export default function TradePage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Submission failed");
      return;
    }
    setMessage("Thank you — we’ll review your trade application shortly.");
    e.currentTarget.reset();
  }

  return (
    <div className="container-site py-12 max-w-2xl">
      <p className="eyebrow mb-2">Professionals</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Trade programme</h1>
      <p className="prose-muted mb-10">
        Interior designers, architects and retailers are welcome to apply. Approved accounts receive
        trade guidance, project support and priority communication.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="businessName" required placeholder="Business name" className="input" />
        <input name="contactName" required placeholder="Contact name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="phone" placeholder="Phone" className="input" />
        <input name="website" placeholder="Website" className="input" />
        <input name="vatNumber" placeholder="VAT number" className="input" />
        <textarea name="address" rows={3} placeholder="Business address" className="input" />
        <textarea name="message" rows={4} placeholder="Tell us about your work" className="input" />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
        <button type="submit" className="btn-primary">
          Submit application
        </button>
      </form>
    </div>
  );
}
