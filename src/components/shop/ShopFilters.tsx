"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const SHAPES = ["drum", "empire", "oval", "rectangular", "coolie", "square"] as const;

const PRICE_FROM = [
  { value: "25", label: "£25" },
  { value: "50", label: "£50" },
  { value: "75", label: "£75" },
  { value: "100", label: "£100" },
];

const PRICE_TO = [
  { value: "50", label: "£50" },
  { value: "75", label: "£75" },
  { value: "100", label: "£100" },
  { value: "150", label: "£150" },
];

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Draft = { shape: string; min: string; max: string };

export function ShopFilters({
  slug,
  current,
  showShape,
  total,
}: {
  slug: string;
  current: Record<string, string | undefined>;
  showShape?: boolean;
  total?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setDrawerOpen(false), []);
  useFocusTrap(drawerOpen, panelRef, close);
  const titleId = useId();

  const shape = current.shape || "";
  const min = current.min || "";
  const max = current.max || "";
  const sort = current.sort || "";

  const [draft, setDraft] = useState<Draft>({ shape, min, max });

  useEffect(() => {
    if (drawerOpen) setDraft({ shape, min, max });
  }, [drawerOpen, shape, min, max]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  function writeParams(next: Record<string, string | undefined>, mode: "replace" | "push" = "replace") {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const qs = params.toString();
    const href = qs ? `/shop/${slug}?${qs}` : `/shop/${slug}`;
    if (mode === "push") router.push(href);
    else router.replace(href);
  }

  function clearKey(key: string) {
    writeParams({ [key]: undefined });
  }

  function applyDraft() {
    writeParams({
      shape: draft.shape || undefined,
      min: draft.min || undefined,
      max: draft.max || undefined,
      sort: sort || undefined,
    });
    setDrawerOpen(false);
  }

  const activeChips: { key: string; label: string }[] = [];
  if (shape) activeChips.push({ key: "shape", label: `Shape: ${titleCase(shape)}` });
  if (min) activeChips.push({ key: "min", label: `From £${min}` });
  if (max) activeChips.push({ key: "max", label: `To £${max}` });
  const activeCount = activeChips.length;
  const hasActiveFilters = activeCount > 0;

  const filterFields = (
    <div className="shop-filter-fields">
      {showShape && (
        <label className="shop-filter-field">
          <span className="label">Shape</span>
          <select
            className="input"
            value={drawerOpen ? draft.shape : shape}
            onChange={(e) => {
              if (drawerOpen) setDraft((d) => ({ ...d, shape: e.target.value }));
              else writeParams({ shape: e.target.value || undefined, min, max, sort: sort || undefined });
            }}
          >
            <option value="">All shapes</option>
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="shop-filter-field">
        <span className="label">Price from</span>
        <select
          className="input"
          value={drawerOpen ? draft.min : min}
          onChange={(e) => {
            if (drawerOpen) setDraft((d) => ({ ...d, min: e.target.value }));
            else writeParams({ shape: shape || undefined, min: e.target.value || undefined, max, sort: sort || undefined });
          }}
        >
          <option value="">Any</option>
          {PRICE_FROM.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="shop-filter-field">
        <span className="label">Price to</span>
        <select
          className="input"
          value={drawerOpen ? draft.max : max}
          onChange={(e) => {
            if (drawerOpen) setDraft((d) => ({ ...d, max: e.target.value }));
            else writeParams({ shape: shape || undefined, min, max: e.target.value || undefined, sort: sort || undefined });
          }}
        >
          <option value="">Any</option>
          {PRICE_TO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <>
      <div className="shop-filter-bar">
        <div className="shop-filter-toolbar">
          <div className="shop-filter-toolbar-left">
            <button
              type="button"
              className="shop-filter-trigger md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />
              Filters
              {activeCount > 0 && <span className="shop-filter-badge">{activeCount}</span>}
            </button>
            {typeof total === "number" && (
              <p className="shop-filter-count">
                {total} {total === 1 ? "piece" : "pieces"}
                {hasActiveFilters ? " · filtered" : null}
              </p>
            )}
          </div>

          <label className="shop-filter-sort">
            <span className="label">Sort</span>
            <select
              className="input"
              value={sort}
              onChange={(e) =>
                writeParams({
                  shape: shape || undefined,
                  min: min || undefined,
                  max: max || undefined,
                  sort: e.target.value || undefined,
                })
              }
            >
              <option value="">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="title">Name</option>
              <option value="featured">Featured</option>
            </select>
          </label>
        </div>

        <div className="hidden md:block">{filterFields}</div>

        {hasActiveFilters && (
          <div className="shop-filter-chips">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="shop-chip"
                onClick={() => clearKey(chip.key)}
                aria-label={`Remove ${chip.label}`}
              >
                {chip.label}
                <X size={12} strokeWidth={2} aria-hidden />
              </button>
            ))}
            <Link href={`/shop/${slug}`} className="shop-chip-clear">
              Clear all
            </Link>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="shop-filter-drawer-root">
          <button
            type="button"
            className="shop-filter-drawer-backdrop"
            aria-label="Close filters"
            onClick={close}
          />
          <div
            ref={panelRef}
            className="shop-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="shop-filter-drawer-header">
              <div>
                <p className="eyebrow mb-0.5">Refine</p>
                <h2 id={titleId} className="font-display text-2xl tracking-tight">
                  Filters
                </h2>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center focus-ring"
                aria-label="Close filters"
                onClick={close}
              >
                <X size={20} />
              </button>
            </div>
            <div className="shop-filter-drawer-body">{filterFields}</div>
            <div className="shop-filter-drawer-footer">
              <Link href={`/shop/${slug}`} className="btn-secondary flex-1" onClick={close}>
                Clear
              </Link>
              <button type="button" className="btn-primary flex-1" onClick={applyDraft}>
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
