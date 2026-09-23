"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(open, panelRef, close);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("lumina:search-open", openHandler);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("lumina:search-open", openHandler);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-[80] bg-ivory text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="container-site pt-10 md:pt-24 max-w-3xl">
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="flex h-10 w-10 items-center justify-center focus-ring"
          >
            <X size={22} />
          </button>
        </div>
        <form
          className="flex items-center gap-3 border-b border-ink pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            const query = q.trim();
            if (!query) return;
            close();
            router.push(`/search?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={22} strokeWidth={1.5} aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lampshades, fabrics…"
            className="flex-1 min-w-0 bg-transparent text-xl md:text-2xl outline-none font-display text-ink"
            aria-label="Search catalogue"
          />
        </form>
      </div>
    </div>
  );
}
