"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_MEGA, SITE } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";

const EXTRA_LINKS = [
  { href: "/design-your-shade", label: "Design your shade" },
  { href: "/trade", label: "Trade" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ items }: { items: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden shrink-0">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center text-[color:var(--ink)]"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-[color:var(--ivory)] text-[color:var(--ink)]"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="shrink-0 border-b border-[color:var(--line)] bg-[color:var(--ivory)]">
            <div className="container-site flex items-center justify-between py-3">
              <span className="font-display text-2xl text-[color:var(--ink)]">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-[color:var(--ink)]"
                onClick={() => setOpen(false)}
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto overscroll-contain container-site py-6 pb-10">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-3 font-display text-2xl text-[color:var(--ink)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.mega && (
                    <ul className="mb-3 ml-1 space-y-2 border-l border-[color:var(--line)] pl-4">
                      {NAV_MEGA.lampshades.columns.flatMap((col) =>
                        col.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="block py-1 text-[15px] text-[color:var(--muted)]"
                              onClick={() => setOpen(false)}
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-[color:var(--line)] pt-4 space-y-1">
              {EXTRA_LINKS.filter(
                (l) => !items.some((i) => i.href === l.href)
              ).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block py-2.5 text-[15px] tracking-wide text-[color:var(--ink)]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-[color:var(--muted)]">
              <a href={`mailto:${SITE.email}`} className="underline">
                {SITE.email}
              </a>
            </p>
          </nav>
        </div>
      )}
    </div>
  );
}
