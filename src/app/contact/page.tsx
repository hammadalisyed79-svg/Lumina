"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        subject: fd.get("subject"),
        message: fd.get("message"),
      }),
    });
    setStatus(res.ok ? "ok" : "err");
    if (res.ok) e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
        Contact
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl">
        Talk to the studio
      </h1>
      <p className="mt-4 text-[var(--muted)] max-w-xl">
        Questions about sizes, fittings, custom prints, or wholesale? Send a
        message and we&apos;ll get back to you.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <input name="name" required placeholder="Name" className="field" />
          <input name="email" type="email" required placeholder="Email" className="field" />
        </div>
        <input name="subject" placeholder="Subject" className="field" />
        <textarea
          name="message"
          required
          placeholder="How can we help?"
          className="field min-h-40"
        />
        <button type="submit" className="btn-primary">
          Send message
        </button>
        {status === "ok" && (
          <p className="text-sm text-[var(--brass-deep)]">Message received — thank you.</p>
        )}
        {status === "err" && (
          <p className="text-sm text-red-700">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
