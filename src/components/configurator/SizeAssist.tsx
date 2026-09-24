"use client";

import { useState } from "react";
import {
  recommendSizeRange,
} from "@/lib/configurator/compatibility";
import type { SizeOpt, UseType } from "@/lib/configurator/types";

type Props = {
  useType: UseType | null;
  availableSizes: SizeOpt[];
};

export function SizeAssist({ useType, availableSizes }: Props) {
  const [open, setOpen] = useState(false);
  const [baseW, setBaseW] = useState("");
  const [baseH, setBaseH] = useState("");

  const w = Number(baseW) || null;
  const h = Number(baseH) || null;
  const guidance = open ? recommendSizeRange(useType, w, h) : null;

  const matches =
    guidance &&
    availableSizes.filter((s) => {
      const d = s.diameterCm ?? s.widthCm;
      if (d == null) return false;
      return d >= guidance.minCm && d <= guidance.maxCm;
    });

  return (
    <div className="mt-5">
      <button
        type="button"
        className="text-sm text-bronze underline underline-offset-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide size help" : "Not sure which size?"}
      </button>

      {open && (
        <div className="mt-4 surface-panel p-4 space-y-3">
          <p className="text-sm prose-muted">
            Advisory only — we will not change your selection automatically.
          </p>
          {(useType === "table" || useType === "floor" || !useType) && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">Base width (cm)</span>
                <input
                  type="number"
                  min={5}
                  max={80}
                  className="input"
                  value={baseW}
                  onChange={(e) => setBaseW(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Base height (cm)</span>
                <input
                  type="number"
                  min={5}
                  max={200}
                  className="input"
                  value={baseH}
                  onChange={(e) => setBaseH(e.target.value)}
                />
              </label>
            </div>
          )}
          {guidance && (
            <div>
              <p className="text-sm font-medium">
                Consider {guidance.minCm}–{guidance.maxCm} cm
              </p>
              <p className="text-xs prose-muted mt-1">{guidance.note}</p>
              {matches && matches.length > 0 && (
                <p className="text-xs text-muted mt-2">
                  Available near that range:{" "}
                  {matches.slice(0, 4).map((s) => s.name).join(", ")}
                  {matches.length > 4 ? "…" : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
