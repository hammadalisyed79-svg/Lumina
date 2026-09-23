"use client";

import Image from "next/image";
import { FABRIC_FILTERS, fabricFamily, type FabricFamily } from "@/lib/studio/fabric-family";
import { formatMoney } from "@/lib/utils";

export type FabricOpt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  imageUrl?: string | null;
  swatchUrl?: string | null;
  material?: string | null;
  colour?: string | null;
  pattern?: string | null;
  description?: string | null;
};

function usable(url?: string | null) {
  if (!url || url.includes(".heic") || url.includes("placeholder")) return null;
  return url;
}

export function FabricSwatchGrid({
  fabrics,
  value,
  onChange,
  filter,
  onFilterChange,
}: {
  fabrics: FabricOpt[];
  value: string;
  onChange: (id: string) => void;
  filter: FabricFamily;
  onFilterChange: (f: FabricFamily) => void;
}) {
  const available = new Set(fabrics.map((f) => fabricFamily(f.material, f.name, f.pattern)));
  const filtered =
    filter === "all"
      ? fabrics
      : fabrics.filter((f) => fabricFamily(f.material, f.name, f.pattern) === filter);

  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Choose a fabric</h2>
      <div className="lux-rule" />
      <p className="prose-muted text-sm mb-5 max-w-md">
        Swatches from the studio — filter by material, then select a cloth for the live preview.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {FABRIC_FILTERS.filter((f) => f.id === "all" || available.has(f.id)).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors ${
              filter === f.id ? "bg-ink text-ivory" : "border border-line text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="prose-muted text-sm">No fabrics in this family — try All.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((f) => {
            const img = usable(f.swatchUrl) || usable(f.imageUrl);
            const selected = value === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange(f.id)}
                className={`studio-option !p-0 overflow-hidden text-left ${selected ? "is-selected" : ""}`}
              >
                <div className="relative aspect-square bg-stone">
                  {img ? (
                    <Image
                      src={img}
                      alt={f.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width:640px) 50vw, 180px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted px-2 text-center">
                      {f.material || "Fabric"}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm leading-snug line-clamp-2">{f.name}</p>
                  <p className="text-[11px] tracking-[0.08em] uppercase text-muted mt-1.5">
                    {[f.material, f.colour].filter(Boolean).join(" · ") ||
                      (f.priceMod ? `+${formatMoney(f.priceMod)}` : "Included")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
