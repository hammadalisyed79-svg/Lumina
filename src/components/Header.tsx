"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { LOGO_IMAGE, NAV, SITE } from "@/lib/site";
import { useCart } from "./CartProvider";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[var(--ink)] text-[var(--mist)] text-center text-xs tracking-[0.18em] uppercase py-2.5">
        Free UK shipping on orders over £75 · Handmade to order
      </div>
      <div className="bg-[var(--paper)]/90 backdrop-blur-md border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-18 py-3">
          <button
            className="lg:hidden p-2"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <Image
              src={LOGO_IMAGE}
              alt={SITE.name}
              width={52}
              height={38}
              className="h-9 w-auto object-contain"
              priority
            />
            <div className="leading-none">
              <div className="font-[family-name:var(--font-display)] text-xl tracking-[0.04em] text-[var(--ink)] group-hover:text-[var(--brass)] transition-colors">
                Lumina Hub
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] mt-1">
                Lighting · Home Decor
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm tracking-wide text-[var(--ink)]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[var(--brass)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/about" className="hover:text-[var(--brass)] transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <form
              action="/shop"
              className="hidden md:flex items-center gap-2 border border-[var(--line)] rounded-full px-3 py-1.5 bg-white/60"
            >
              <Search size={16} className="text-[var(--muted)]" />
              <input
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search shades…"
                className="bg-transparent outline-none text-sm w-36 lg:w-44"
              />
            </form>
            <Link
              href="/cart"
              className="relative p-2 hover:text-[var(--brass)] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[var(--brass)] text-[var(--ink)] text-[10px] font-semibold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[78%] max-w-sm bg-[var(--paper)] p-6 shadow-xl animate-slide-in">
            <div className="flex justify-between items-center mb-8">
              <span className="font-[family-name:var(--font-display)] text-2xl">
                Lumina Hub
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-4 text-lg">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/about" onClick={() => setOpen(false)}>
                About
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
