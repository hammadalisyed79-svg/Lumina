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
    <div className="container-site py-14 max-w-md">
      <h1 className="font-display text-4xl mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" minLength={8} />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-[color:var(--muted)] mt-6">
        <Link href="/account/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-[color:var(--muted)] mt-3">
        New here?{" "}
        <Link href="/account/register" className="underline">
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
