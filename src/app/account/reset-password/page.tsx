"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      router.push("/account/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        New password
        <input
          type="password"
          required
          minLength={8}
          className="mt-1 w-full border border-[color:var(--line)] px-3 py-2 bg-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-site py-16 max-w-md">
      <h1 className="font-display text-4xl mb-4">Choose a new password</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <ResetForm />
      </Suspense>
      <p className="mt-6 text-sm">
        <Link href="/account/login" className="underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
