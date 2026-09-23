"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type NavItem = { href: string; label: string; mega?: "lampshades" };
type Mega = {
  label: string;
  href: string;
  columns: { title: string; links: { href: string; label: string }[] }[];
};

export function MegaMenu({ item, menu }: { item: NavItem; menu: Mega }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={item.href}
        className="inline-flex items-center gap-1 hover:text-[color:var(--bronze)] transition-colors"
      >
        {item.label}
        <ChevronDown size={14} />
      </Link>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[720px]">
          <div className="bg-[color:var(--ivory)] border border-[color:var(--line)] shadow-[0_20px_50px_rgba(28,25,21,0.08)] p-8 grid grid-cols-3 gap-8">
            {menu.columns.map((col) => (
              <div key={col.title}>
                <p className="eyebrow mb-3">{col.title}</p>
                <ul className="space-y-2 normal-case tracking-normal text-[15px]">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-[color:var(--ink)] hover:text-[color:var(--bronze)]"
                        onClick={() => setOpen(false)}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
