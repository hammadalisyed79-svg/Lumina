"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }
    await signIn("credentials", {
      email: String(fd.get("email")),
      password,
      redirect: false,
    });
    setLoading(false);
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="container-site section-pad max-w-md">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="section-title">Create account</h1>
      <div className="lux-rule" />
      <form onSubmit={onSubmit} className="surface-panel p-6 md:p-8 space-y-4 mt-2">
        <label className="block">
          <span className="label">Full name</span>
          <input name="name" required className="input" autoComplete="name" />
        </label>
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
            minLength={8}
            className="input"
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="label">Confirm password</span>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            className="input"
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/account/login" className="underline underline-offset-4 hover:text-bronze">
          Sign in
        </Link>
      </p>
    </div>
  );
}
