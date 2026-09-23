"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(sp.get("callbackUrl") || "/account");
    router.refresh();
  }

  return (
    <div className="container-site section-pad max-w-md">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="section-title">Sign in</h1>
      <div className="lux-rule" />
      <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-4 mt-2">
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required className="input" autoComplete="email" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            required
            className="input"
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-muted mt-6">
        <Link href="/account/forgot-password" className="underline underline-offset-4 hover:text-bronze">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted mt-3">
        New here?{" "}
        <Link href="/account/register" className="underline underline-offset-4 hover:text-bronze">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
