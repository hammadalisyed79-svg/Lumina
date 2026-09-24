"use client";

import { useMemo, useState, useCallback, memo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import {
  FABRIC_BROWSER_FILTERS,
  fabricMatchesFilter,
  type FabricFilterId,
} from "@/lib/configurator/fabric-filters";
import type { FabricOpt } from "@/lib/configurator/types";

type Props = {
  fabrics: FabricOpt[];
  value: string | null;
  onChange: (id: string) => void;
  onViewFabric?: (fabric: FabricOpt) => void;
};

function FabricBrowserInner({ fabrics, value, onChange, onViewFabric }: Props) {
  const [filter, setFilter] = useState<FabricFilterId>("all");
  const [query, setQuery] = useState("");

  const availableFilters = useMemo(() => {
    return FABRIC_BROWSER_FILTERS.filter(
      (f) =>
        f.id === "all" ||
        fabrics.some((fab) => fabricMatchesFilter(fab, f.id))
    );
  }, [fabrics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fabrics.filter((f) => {
      if (!fabricMatchesFilter(f, filter)) return false;
      if (!q) return true;
      const hay = `${f.name} ${f.material || ""} ${f.colour || ""} ${f.pattern || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [fabrics, filter, query]);

  const onSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">
        Choose fabric
      </h2>
      <div className="lux-rule" />
      <p className="prose-muted text-sm mb-5 max-w-md">
        Search or filter the catalogue. Selecting a fabric updates the shade instantly.
      </p>

      <label className="block mb-4">
        <span className="sr-only">Search fabrics</span>
        <input
          type="search"
          value={query}
          onChange={onSearch}
          placeholder="Search fabrics…"
          className="input"
          autoComplete="off"
        />
      </label>

      <div className="flex flex-wrap gap-1.5 mb-6" role="group" aria-label="Fabric filters">
        {availableFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`cfg-chip ${filter === f.id ? "is-active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="surface-panel p-6 text-sm">
          <p className="prose-muted mb-3">No fabrics match this filter.</p>
          <button type="button" className="btn-quiet text-sm" onClick={() => setFilter("all")}>
            Show all fabrics
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((f) => {
            const img = f.swatchUrl || f.imageUrl;
            const selected = value === f.id;
            return (
              <div key={f.id} className="relative">
                <button
                  type="button"
                  onClick={() => onChange(f.id)}
                  aria-pressed={selected}
                  className={`studio-option !p-0 overflow-hidden text-left w-full ${
                    selected ? "is-selected" : ""
                  }`}
                >
                  <div className="relative aspect-square bg-stone">
                    {img ? (
                      <MediaImage
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:640px) 50vw, 160px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted px-2 text-center">
                        {f.material || "Fabric"}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm leading-snug">{f.name}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {[f.material, f.priceMod ? `+${formatMoney(f.priceMod)}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {selected && (
                      <span className="sr-only">Selected</span>
                    )}
                  </div>
                </button>
                {onViewFabric && (
                  <button
                    type="button"
                    className="absolute top-2 right-2 z-10 bg-ivory/90 px-2 py-1 text-[10px] tracking-[0.1em] uppercase border border-line"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewFabric(f);
                    }}
                  >
                    View
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const FabricBrowser = memo(FabricBrowserInner);
