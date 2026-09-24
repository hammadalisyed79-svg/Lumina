"use client";

import { useState } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { ContentCtas, ContentHero } from "@/components/content/ContentHero";

export default function BespokePage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;

    let attachments: Record<string, unknown>[] = [];
    if (file && file.size > 0) {
      if (file.size > 4_000_000) {
        setError("Please keep uploads under 4MB");
        return;
      }
      const uploadFd = new FormData();
      uploadFd.append("file", file);
      const uploadRes = await fetch("/api/bespoke/upload", { method: "POST", body: uploadFd });
      if (uploadRes.ok) {
        attachments = [await uploadRes.json()];
      } else {
        attachments = [{ name: file.name, size: file.size, type: file.type }];
      }
    }

    const res = await fetch("/api/bespoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        subject: fd.get("subject"),
        message: fd.get("message"),
        attachments,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Submission failed");
      return;
    }
    setMessage("Enquiry received — our atelier will reply with next steps.");
    form.reset();
  }

  return (
    <div>
      <ContentHero
        eyebrow={COPY.bespokePage.eyebrow}
        title={COPY.bespokePage.title}
        subtitle={COPY.bespokePage.body}
        image="/media/homepage/story-craft.png"
        alt="Custom lampshade work at Lumina Hub"
        ctas={[
          { href: "/design-your-shade", label: "Design your shade", variant: "secondary" },
          { href: "/size-guide", label: "Size guide", variant: "quiet" },
        ]}
      />

      <div className="container-site section-pad max-w-2xl">
        <p className="eyebrow mb-3">Brief</p>
        <h2 className="font-display text-3xl tracking-tight mb-3">Tell us about the piece</h2>
        <div className="lux-rule" />
        <p className="prose-muted mb-8">
          Include measurements in centimetres if you have them. Prefer to configure yourself first?{" "}
          <Link href="/design-your-shade" className="underline underline-offset-4 hover:text-bronze">
            Open the studio
          </Link>
          .
        </p>

        <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-5">
          <label className="block">
            <span className="label">Name</span>
            <input name="name" required className="input" autoComplete="name" />
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
            <span className="label">Subject</span>
            <input name="subject" className="input" placeholder="e.g. Oval shade for floor lamp" />
          </label>
          <label className="block">
            <span className="label">Project details</span>
            <textarea
              name="message"
              required
              rows={6}
              className="input"
              placeholder="Dimensions, fabric ideas, room context…"
            />
          </label>
          <label className="block">
            <span className="label">Inspiration image (optional)</span>
            <input name="file" type="file" accept="image/*" className="input" />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-muted">{message}</p>}
          <button type="submit" className="btn-primary">
            Send enquiry
          </button>
        </form>

        <ContentCtas
          secondary={{ href: "/trade", label: "Trade application", variant: "secondary" }}
          tertiary={{ href: "/contact", label: "General contact", variant: "quiet" }}
        />
      </div>
    </div>
  );
}
