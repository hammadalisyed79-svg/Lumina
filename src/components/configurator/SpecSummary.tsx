"use client";

import { formatMoney } from "@/lib/utils";
import type { ConfigSelection, ConfigCatalog } from "@/lib/configurator/types";
import { USE_TYPES } from "@/lib/configurator/types";
import type { ShadePriceBreakdown } from "@/lib/configurator/pricing";

type Props = {
  catalog: ConfigCatalog;
  selection: ConfigSelection;
  price: ShadePriceBreakdown | null;
  nextHint?: string | null;
  showPriceDetails?: boolean;
  onTogglePriceDetails?: () => void;
};

export function SpecSummary({
  catalog,
  selection,
  price,
  nextHint,
  showPriceDetails,
  onTogglePriceDetails,
}: Props) {
  const shape = catalog.shapes.find((s) => s.key === selection.shapeKey);
  const size = catalog.sizes.find((s) => s.id === selection.sizeId);
  const fabric = catalog.fabrics.find((f) => f.id === selection.fabricId);
  const lining = catalog.linings.find((l) => l.id === selection.liningId);
  const fitting = catalog.fittings.find((f) => f.id === selection.fittingId);
  const useLabel = USE_TYPES.find((u) => u.id === selection.useType)?.label;

  const rows: { label: string; value: string | null }[] = [
    { label: "Use", value: useLabel || null },
    { label: "Shape", value: shape?.name || null },
    { label: "Size", value: size?.name || null },
    { label: "Fabric", value: fabric?.name || null },
    { label: "Lining", value: lining?.name || null },
    { label: "Fitting", value: fitting?.name || null },
  ];

  return (
    <aside className="cfg-summary surface-panel p-5 md:p-6" aria-live="polite">
      <p className="eyebrow mb-2">Your shade</p>
      <ul className="space-y-2.5 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-4 border-b border-line/60 pb-2">
            <span className="text-muted tracking-[0.06em] uppercase text-[11px]">
              {r.label}
            </span>
            <span className="text-right font-medium">
              {r.value || <span className="text-muted font-normal">—</span>}
            </span>
          </li>
        ))}
      </ul>

      {selection.personalisation && (
        <p className="mt-3 text-sm prose-muted">
          Note: {selection.personalisation}
        </p>
      )}

      <div className="mt-5">
        {price && shape ? (
          <>
            <p className="font-display text-3xl tracking-tight">
              {formatMoney(price.unitPrice)}
            </p>
            {price.quantity > 1 && (
              <p className="text-xs text-muted mt-1">
                × {price.quantity} = {formatMoney(price.lineTotal)}
              </p>
            )}
            {onTogglePriceDetails && (
              <button
                type="button"
                className="mt-2 text-[11px] tracking-[0.1em] uppercase text-bronze underline underline-offset-4"
                onClick={onTogglePriceDetails}
              >
                {showPriceDetails ? "Hide price details" : "Price details"}
              </button>
            )}
            {showPriceDetails && (
              <ul className="mt-3 text-xs text-muted space-y-1">
                <li>Base {formatMoney(price.basePrice + price.shapeMod)}</li>
                {price.sizeMod ? <li>Size +{formatMoney(price.sizeMod)}</li> : null}
                {price.fabricMod ? <li>Fabric +{formatMoney(price.fabricMod)}</li> : null}
                {price.liningMod ? <li>Lining +{formatMoney(price.liningMod)}</li> : null}
                {price.fittingMod ? <li>Fitting +{formatMoney(price.fittingMod)}</li> : null}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm prose-muted">Price appears as you configure.</p>
        )}
      </div>

      {nextHint && (
        <p className="mt-4 text-sm text-bronze border-t border-line pt-4">{nextHint}</p>
      )}
    </aside>
  );
}
