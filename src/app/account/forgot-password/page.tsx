"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Request failed");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-site py-16 max-w-md">
      <h1 className="font-display text-4xl mb-4">Reset password</h1>
      <p className="text-sm text-[color:var(--muted)] mb-8">
        Enter your account email. If it exists, we will send a reset link when email delivery is
        configured.
      </p>
      {sent ? (
        <p className="text-sm">
          If an account exists for that email, a reset link has been prepared. Check your inbox
          (or ask the studio if email is not yet live).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full border border-[color:var(--line)] px-3 py-2 bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/account/login" className="underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
