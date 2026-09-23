"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_MEGA, SITE } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const EXTRA_LINKS = [
  { href: "/design-your-shade", label: "Design your shade" },
  { href: "/trade", label: "Trade" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ items }: { items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(open, panelRef, close);

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
        className="flex h-10 w-10 items-center justify-center text-ink focus-ring"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="fixed inset-0 z-[70] flex flex-col bg-ivory text-ink"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="shrink-0 border-b border-line bg-ivory">
            <div className="container-site flex items-center justify-between py-3">
              <span className="font-display text-2xl text-ink">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-ink focus-ring"
                onClick={close}
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
                    className="block py-3 font-display text-2xl text-ink focus-ring"
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                  {item.mega && (
                    <ul className="mb-3 ml-1 space-y-2 border-l border-line pl-4">
                      {NAV_MEGA.lampshades.columns.flatMap((col) =>
                        col.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="block py-1.5 text-[15px] text-muted focus-ring"
                              onClick={close}
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
            <div className="mt-6 border-t border-line pt-4 space-y-1">
              {EXTRA_LINKS.filter((l) => !items.some((i) => i.href === l.href)).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block py-2.5 text-[15px] tracking-wide text-ink focus-ring"
                  onClick={close}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">
              <a href={`mailto:${SITE.email}`} className="underline text-ink focus-ring">
                {SITE.email}
              </a>
            </p>
          </nav>
        </div>
      )}
    </div>
  );
}
