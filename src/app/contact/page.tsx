"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";

const STUDIO_BRIEF = "luminahub_studio_enquiry_brief";

function ContactForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [brief, setBrief] = useState("");

  useEffect(() => {
    if (searchParams.get("from") !== "studio") return;
    try {
      const raw = sessionStorage.getItem(STUDIO_BRIEF);
      if (raw) {
        setBrief(raw);
        sessionStorage.removeItem(STUDIO_BRIEF);
      }
    } catch {
      /* ignore */
    }
  }, [searchParams]);

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
    setBrief("");
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-4 h-fit">
      {brief && (
        <p className="text-xs text-muted border border-line p-3 bg-paper">
          Your current shade configuration has been included in the message below.
        </p>
      )}
      <label className="block">
        <span className="label">Name</span>
        <input name="name" required className="input" />
      </label>
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required className="input" />
      </label>
      <label className="block">
        <span className="label">Message</span>
        <textarea
          name="message"
          required
          rows={6}
          className="input"
          defaultValue={brief || undefined}
          key={brief ? "with-brief" : "empty"}
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-muted">{message}</p>}
      <button type="submit" className="btn-primary w-full sm:w-auto">
        Send message
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="container-site section-pad">
      <div className="grid md:grid-cols-2 gap-12 md:gap-16 max-w-5xl">
        <div>
          <p className="eyebrow mb-3">{COPY.contact.eyebrow}</p>
          <h1 className="section-title">{COPY.contact.title}</h1>
          <div className="lux-rule" />
          <p className="prose-muted mb-10">{COPY.contact.body}</p>
          <ul className="space-y-6 text-[15px]">
            <li>
              <span className="eyebrow block mb-1.5">Email</span>
              <a className="underline underline-offset-4 hover:text-bronze" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1.5">Phone</span>
              <a className="underline underline-offset-4 hover:text-bronze" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                {SITE.phone}
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1.5">WhatsApp</span>
              <a
                className="underline underline-offset-4 hover:text-bronze"
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message us
              </a>
            </li>
            <li>
              <span className="eyebrow block mb-1.5">Workshop</span>
              <p className="prose-muted">{SITE.address}</p>
            </li>
          </ul>
        </div>
        <Suspense fallback={<div className="surface-panel p-6 md:p-8 h-64 cfg-skel" />}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}
