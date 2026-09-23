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
    <div className="container-site section-pad max-w-4xl">
      <p className="eyebrow mb-3">{COPY.tradePage.eyebrow}</p>
      <h1 className="section-title mb-3">{COPY.tradePage.title}</h1>
      <div className="lux-rule" />
      <p className="prose-muted mb-10 md:mb-14 max-w-2xl">{COPY.tradePage.body}</p>

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

      <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-5 max-w-2xl">
        <label className="block">
          <span className="label">Business name</span>
          <input name="businessName" required className="input" />
        </label>
        <label className="block">
          <span className="label">Contact name</span>
          <input name="contactName" required className="input" />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required className="input" />
        </label>
        <label className="block">
          <span className="label">Phone</span>
          <input name="phone" className="input" />
        </label>
        <label className="block">
          <span className="label">Website</span>
          <input name="website" className="input" />
        </label>
        <label className="block">
          <span className="label">VAT number</span>
          <input name="vatNumber" className="input" />
        </label>
        <label className="block">
          <span className="label">Business address</span>
          <textarea name="address" rows={3} className="input" />
        </label>
        <label className="block">
          <span className="label">About your work</span>
          <textarea name="message" rows={4} className="input" />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-muted">{message}</p>}
        <button type="submit" className="btn-primary">
          Submit application
        </button>
      </form>
    </div>
  );
}
