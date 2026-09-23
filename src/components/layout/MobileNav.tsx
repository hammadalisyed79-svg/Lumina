"use client";

import Link from "next/link";
import { Menu, X, Plus, Minus } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NAV_MEGA, SITE } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type AccordionItem = {
  id: string;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
  groups?: { id: string; title: string; href?: string; links: { label: string; href: string }[] }[];
};

const STUDIO_LINKS = [
  { href: "/about", label: "About" },
  { href: "/craft", label: "Craft" },
  { href: "/trade", label: "Trade" },
  { href: "/bespoke", label: "Bespoke" },
  { href: "/size-guide", label: "Size guide" },
  { href: "/care", label: "Care" },
  { href: "/contact", label: "Contact" },
];

function buildSections(items: NavLink[]): AccordionItem[] {
  const sections: AccordionItem[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    seen.add(item.href);
    if (item.mega === "lampshades") {
      sections.push({
        id: "lampshades",
        label: item.label,
        href: item.href,
        groups: NAV_MEGA.lampshades.columns.map((col, i) => ({
          id: `lampshades-${i}-${col.title.toLowerCase().replace(/\s+/g, "-")}`,
          title: col.title,
          links: col.links,
        })),
      });
      continue;
    }
    sections.push({
      id: item.href,
      label: item.label,
      href: item.href,
    });
  }

  // Ensure core shop categories if CMS nav omitted them
  for (const fallback of [
    { href: "/shop/fabrics", label: "Fabrics" },
    { href: "/shop/cushions", label: "Cushions" },
    { href: "/shop/kits", label: "Kits" },
  ]) {
    if (!seen.has(fallback.href) && !sections.some((s) => s.href === fallback.href)) {
      sections.push({ id: fallback.href, ...fallback });
    }
  }

  if (!sections.some((s) => s.href === "/design-your-shade")) {
    sections.push({
      id: "design",
      label: "Design your shade",
      href: "/design-your-shade",
    });
  }

  const primaryHrefs = new Set(items.map((i) => i.href));
  const studioLinks = STUDIO_LINKS.filter((l) => !primaryHrefs.has(l.href));

  sections.push({
    id: "studio",
    label: "Studio",
    children: studioLinks.length ? studioLinks : STUDIO_LINKS,
  });

  return sections;
}

function ExpandIcon({ open }: { open: boolean }) {
  return open ? (
    <Minus size={18} strokeWidth={1.75} aria-hidden />
  ) : (
    <Plus size={18} strokeWidth={1.75} aria-hidden />
  );
}

function AccordionRow({
  label,
  open,
  onToggle,
  controlsId,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      className="mobile-nav-row"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      <span className="mobile-nav-row-label">{label}</span>
      <span className="mobile-nav-row-icon">
        <ExpandIcon open={open} />
      </span>
    </button>
  );
}

export function MobileNav({ items }: { items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const close = useCallback(() => {
    setOpen(false);
    setExpanded({});
  }, []);
  useFocusTrap(open, panelRef, close);

  const sections = buildSections(items);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
          className="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <header className="mobile-nav-header">
            <div className="container-site flex items-center justify-between py-3.5">
              <div>
                <p className="eyebrow mb-0.5 text-muted">Lumina Hub</p>
                <p className="font-display text-2xl tracking-tight text-ink">Menu</p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-ink focus-ring"
                onClick={close}
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <nav className="mobile-nav-body container-site">
            <ul className="mobile-nav-list">
              {sections.map((section) => {
                const hasSubs = Boolean(section.groups?.length || section.children?.length);
                const isOpen = Boolean(expanded[section.id]);
                const panelId = `${baseId}-${section.id}`;

                if (!hasSubs && section.href) {
                  return (
                    <li key={section.id} className="mobile-nav-item">
                      <Link href={section.href} className="mobile-nav-row is-link" onClick={close}>
                        <span className="mobile-nav-row-label">{section.label}</span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={section.id} className="mobile-nav-item">
                    <AccordionRow
                      label={section.label}
                      open={isOpen}
                      onToggle={() => toggle(section.id)}
                      controlsId={panelId}
                    />
                    <div
                      id={panelId}
                      className={`mobile-nav-panel-inner ${isOpen ? "is-open" : ""}`}
                      hidden={!isOpen}
                    >
                      {section.href && (
                        <Link
                          href={section.href}
                          className="mobile-nav-sublink is-primary"
                          onClick={close}
                        >
                          View all {section.label.toLowerCase()}
                        </Link>
                      )}

                      {section.groups?.map((group) => {
                        const gOpen = Boolean(expanded[group.id]);
                        const gId = `${baseId}-${group.id}`;
                        return (
                          <div key={group.id} className="mobile-nav-group">
                            <button
                              type="button"
                              className="mobile-nav-group-row"
                              aria-expanded={gOpen}
                              aria-controls={gId}
                              onClick={() => toggle(group.id)}
                            >
                              <span>{group.title}</span>
                              <ExpandIcon open={gOpen} />
                            </button>
                            <div
                              id={gId}
                              className={`mobile-nav-group-links ${gOpen ? "is-open" : ""}`}
                              hidden={!gOpen}
                            >
                              {group.links.map((l) => (
                                <Link
                                  key={l.href}
                                  href={l.href}
                                  className="mobile-nav-sublink"
                                  onClick={close}
                                >
                                  {l.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {section.children?.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="mobile-nav-sublink"
                          onClick={close}
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mobile-nav-footer">
              <a href={`mailto:${SITE.email}`} className="mobile-nav-contact focus-ring">
                {SITE.email}
              </a>
              <p className="text-xs text-muted mt-2">
                {SITE.hours.weekdays} · WhatsApp preferred
              </p>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
