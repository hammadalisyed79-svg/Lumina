"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "ok" : "err");
    if (res.ok) setEmail("");
  }

  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--ink)] text-[var(--mist)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-[family-name:var(--font-display)] text-3xl text-white tracking-wide">
            Lumina Hub
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-xs">
            UK-made lampshades, printed fabrics, and cushion covers — crafted to
            order with velvet textures and bespoke prints.
          </p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--brass)] mb-4">
            Shop
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/shop?category=Drum">Drum Lampshades</Link>
            </li>
            <li>
              <Link href="/shop?category=Rectangular">Rectangular</Link>
            </li>
            <li>
              <Link href="/shop?category=Fabric">Printed Fabric</Link>
            </li>
            <li>
              <Link href="/shop?category=Cushion%20Covers">Cushion Covers</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--brass)] mb-4">
            Help
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/size-fitting">Size & Fitting</Link>
            </li>
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <a href={SITE.whatsapp} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--brass)] mb-4">
            Illuminate your inbox
          </h3>
          <p className="text-sm text-white/70 mb-4">
            Styling notes and new prints, no clutter.
          </p>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none focus:border-[var(--brass)]"
            />
            <button
              type="submit"
              className="bg-[var(--brass)] text-[var(--ink)] px-4 py-2 text-sm font-medium hover:brightness-110 transition"
            >
              Join
            </button>
          </form>
          {status === "ok" && (
            <p className="text-xs text-[var(--brass)] mt-2">You&apos;re on the list.</p>
          )}
          {status === "err" && (
            <p className="text-xs text-red-300 mt-2">Please try again.</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {SITE.name}. Handmade in the United Kingdom.
      </div>
    </footer>
  );
}
