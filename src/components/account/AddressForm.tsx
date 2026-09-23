"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddressForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="fullName" required placeholder="Full name" className="input" />
      <input name="line1" required placeholder="Address line 1" className="input" />
      <input name="line2" placeholder="Address line 2" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <input name="city" required placeholder="City" className="input" />
        <input name="postcode" required placeholder="Postcode" className="input" />
      </div>
      <input name="county" placeholder="County" className="input" />
      <input name="phone" placeholder="Phone" className="input" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" value="true" />
        Set as default
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-secondary">
        Save address
      </button>
    </form>
  );
}
