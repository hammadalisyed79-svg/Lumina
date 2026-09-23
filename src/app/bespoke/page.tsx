"use client";

import { useState } from "react";

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
    <div className="container-site py-12 max-w-2xl">
      <p className="eyebrow mb-2">Atelier</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Bespoke enquiry</h1>
      <p className="prose-muted mb-10">
        Share dimensions, fabric preferences or inspiration images. We’ll respond with feasibility
        and timing for a custom shade.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="name" required placeholder="Name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="phone" placeholder="Phone" className="input" />
        <input name="subject" placeholder="Subject" className="input" />
        <textarea name="message" required rows={6} placeholder="Project details" className="input" />
        <label className="block">
          <span className="label">Inspiration image (optional)</span>
          <input name="file" type="file" accept="image/*" className="input" />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
        <button type="submit" className="btn-primary">
          Send enquiry
        </button>
      </form>
    </div>
  );
}
