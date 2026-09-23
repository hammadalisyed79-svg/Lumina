"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";

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
    setMessage("Thank you — we’ll review your application and reply shortly.");
    e.currentTarget.reset();
  }

  return (
    <div className="container-site py-12 max-w-4xl">
      <p className="eyebrow mb-2">{COPY.tradePage.eyebrow}</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">{COPY.tradePage.title}</h1>
      <p className="prose-muted mb-10 max-w-2xl">{COPY.tradePage.body}</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="border-t border-[color:var(--line)] pt-4">
          <p className="font-medium mb-2">Scheme support</p>
          <p className="prose-muted text-sm">
            Help matching fabrics, silhouettes and sizes across rooms and client briefs.
          </p>
        </div>
        <div className="border-t border-[color:var(--line)] pt-4">
          <p className="font-medium mb-2">Clearer lead times</p>
          <p className="prose-muted text-sm">
            Priority communication once approved — so deadlines stay realistic.
          </p>
        </div>
        <div className="border-t border-[color:var(--line)] pt-4">
          <p className="font-medium mb-2">Bespoke options</p>
          <p className="prose-muted text-sm">
            Custom sizes and fabrics via{" "}
            <Link href="/bespoke" className="underline">
              bespoke enquiry
            </Link>
            .
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
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
