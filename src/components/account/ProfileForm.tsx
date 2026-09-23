"use client";

import { useState } from "react";

export function ProfileForm({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
      }),
    });
    setMessage(res.ok ? "Profile updated." : "Update failed.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input className="input" value={email} disabled />
      <input name="name" defaultValue={name} placeholder="Name" className="input" />
      <input name="phone" defaultValue={phone} placeholder="Phone" className="input" />
      <button type="submit" className="btn-secondary">
        Save
      </button>
      {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
    </form>
  );
}
