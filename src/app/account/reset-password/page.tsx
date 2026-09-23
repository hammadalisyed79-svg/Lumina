"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirm) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: params.get("email"),
          token: params.get("token"),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/account/login"), 1800);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="surface-panel p-6 md:p-8">
        <p className="text-sm leading-relaxed">
          Password updated. Taking you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-4">
      <label className="block">
        <span className="label">New password</span>
        <input
          type="password"
          required
          minLength={8}
          className="input"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          className="input"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-site section-pad max-w-md">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="section-title">Choose a new password</h1>
      <div className="lux-rule" />
      <Suspense fallback={<p className="text-sm text-muted mt-4">Loading…</p>}>
        <div className="mt-2">
          <ResetForm />
        </div>
      </Suspense>
      <p className="text-sm text-muted mt-6">
        <Link href="/account/login" className="underline underline-offset-4 hover:text-bronze">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
