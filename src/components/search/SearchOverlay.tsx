"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("lumina:search-open", openHandler);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("lumina:search-open", openHandler);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[color:var(--ivory)] text-[color:var(--ink)]">
      <div className="container-site pt-10 md:pt-24 max-w-3xl">
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="flex h-10 w-10 items-center justify-center"
          >
            <X size={22} />
          </button>
        </div>
        <form
          className="flex items-center gap-3 border-b border-[color:var(--ink)] pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            const query = q.trim();
            if (!query) return;
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
          }}
        >
          <Search size={22} strokeWidth={1.5} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lampshades, fabrics…"
            className="flex-1 min-w-0 bg-transparent text-xl md:text-2xl outline-none font-display text-[color:var(--ink)]"
          />
        </form>
        <p className="mt-4 text-sm text-[color:var(--muted)]">Press Enter to search</p>
      </div>
    </div>
  );
}
