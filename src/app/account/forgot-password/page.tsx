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
    <div className="container-site section-pad max-w-md">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="section-title">Forgot password</h1>
      <div className="lux-rule" />
      <p className="prose-muted text-sm mb-6">
        Enter your account email. If it exists, we will send a reset link when email delivery is
        configured.
      </p>
      {sent ? (
        <div className="surface-panel p-6 md:p-8">
          <p className="text-sm leading-relaxed">
            If an account exists for that email, a reset link has been prepared. Check your inbox
            (or ask the studio if email is not yet live).
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              required
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="text-sm text-muted mt-6">
        <Link href="/account/login" className="underline underline-offset-4 hover:text-bronze">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
