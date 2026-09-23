"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage("Message sent — we’ll reply soon.");
    e.currentTarget.reset();
  }

  return (
    <div className="container-site py-12">
      <div className="grid md:grid-cols-2 gap-10 md:gap-14 max-w-5xl">
        <div>
          <p className="eyebrow mb-2">Studio</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">Contact</h1>
          <p className="prose-muted mb-8">
            Questions about sizing, fabrics or a project? Reach the studio directly or send a note
            below.
          </p>
          <ul className="space-y-4 text-[15px]">
            <li>
              <span className="eyebrow block mb-1">Email</span>
              <a className="underline" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1">Phone</span>
              <a className="underline" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                {SITE.phone}
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1">WhatsApp</span>
              <a
                className="underline"
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message us
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1">Workshop</span>
              <p className="prose-muted">{SITE.address}</p>
            </li>
          </ul>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="name" required placeholder="Name" className="input" />
          <input name="email" type="email" required placeholder="Email" className="input" />
          <textarea name="message" required rows={6} placeholder="Message" className="input" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
          <button type="submit" className="btn-primary">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
