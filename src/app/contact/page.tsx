"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <div className="container-site py-12 max-w-xl">
      <h1 className="font-display text-4xl mb-4">Contact</h1>
      <p className="prose-muted mb-8">
        Email{" "}
        <a className="underline" href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>{" "}
        or send a note below.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="name" required placeholder="Name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <textarea name="message" required rows={5} placeholder="Message" className="input" />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
        <button type="submit" className="btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}
