"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { ContentCtas, ContentHero } from "@/components/content/ContentHero";

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
    <div>
      <ContentHero
        eyebrow={COPY.tradePage.eyebrow}
        title={COPY.tradePage.title}
        subtitle={COPY.tradePage.body}
        image="/media/homepage/hero-lifestyle.png"
        alt="Lumina Hub lampshades for interior projects"
        ctas={[
          { href: "/shop/lampshades", label: "Browse catalogue", variant: "secondary" },
          { href: "/bespoke", label: "Bespoke enquiry", variant: "quiet" },
        ]}
      />

      <div className="container-site section-pad max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {COPY.tradePage.benefits.map((b) => (
            <div key={b.title} className="border-t border-line pt-4">
              <p className="font-medium mb-2">{b.title}</p>
              <p className="prose-muted text-sm leading-relaxed">
                {b.title === "Bespoke options" ? (
                  <>
                    Custom sizes and fabrics via{" "}
                    <Link href="/bespoke" className="underline underline-offset-4 hover:text-bronze">
                      bespoke enquiry
                    </Link>
                    .
                  </>
                ) : (
                  b.body
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">
          <div>
            <p className="eyebrow mb-3">Apply</p>
            <h2 className="font-display text-3xl tracking-tight mb-3">Trade application</h2>
            <div className="lux-rule" />
            <p className="prose-muted text-sm mb-6">
              Tell us about your practice. We typically reply within a few working days.
            </p>
            <ContentCtas
              secondary={{
                href: "/design-your-shade",
                label: "Try the studio",
                variant: "secondary",
              }}
              tertiary={{ href: "/contact", label: "Contact first", variant: "quiet" }}
            />
          </div>

          <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-5">
            <label className="block">
              <span className="label">Business name</span>
              <input name="businessName" required className="input" autoComplete="organization" />
            </label>
            <label className="block">
              <span className="label">Contact name</span>
              <input name="contactName" required className="input" autoComplete="name" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input name="email" type="email" required className="input" autoComplete="email" />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input name="phone" className="input" autoComplete="tel" />
            </label>
            <label className="block">
              <span className="label">Website</span>
              <input name="website" className="input" autoComplete="url" />
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
      </div>
    </div>
  );
}
