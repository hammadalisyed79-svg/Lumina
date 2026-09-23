"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_MEGA } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";

export function MobileNav({ items }: { items: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        className="p-1.5"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-[color:var(--ivory)]">
          <div className="container-site flex items-center justify-between py-4 border-b border-[color:var(--line)]">
            <span className="font-display text-2xl">Menu</span>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={22} />
            </button>
          </div>
          <nav className="container-site py-8 space-y-5">
            {items.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="font-display text-3xl"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                {item.mega && (
                  <ul className="mt-3 ml-1 space-y-2 text-[color:var(--muted)]">
                    {NAV_MEGA.lampshades.columns[0].links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setOpen(false)}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
