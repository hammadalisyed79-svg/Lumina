"use client";

import { useMemo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import { liningSwatchHex } from "@/lib/studio/images";
import {
  pickCatalogMatch,
  pickShapeReference,
  shadeTitle as formatShadeTitle,
  sizePreviewScale,
  type PreviewCandidate,
} from "@/lib/studio/preview";

type FabricLike = {
  name?: string | null;
  colour?: string | null;
  material?: string | null;
  pattern?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  swatchUrl?: string | null;
};

type Props = {
  ready: boolean;
  shapeKey: string;
  shapeName?: string | null;
  shapeImage?: string | null;
  fabric: FabricLike | null;
  sizeName?: string | null;
  diameterCm?: number | null;
  heightCm?: number | null;
  liningName?: string | null;
  liningColour?: string | null;
  fittingName?: string | null;
  fittingHint?: string | null;
  unitPrice: number;
  candidates: PreviewCandidate[];
  step: number;
};

const FALLBACK = "/media/homepage/hero-lifestyle.png";

/**
 * Honest step-aware preview:
 * Shape / size / lining / fitting → curated shape hero (+ light chrome)
 * Fabric → cloth only
 * Review → best catalog match for shape + fabric, else hero
 */
export function StudioLivePreview({
  ready,
  shapeName,
  shapeImage,
  fabric,
  sizeName,
  diameterCm,
  heightCm,
  liningName,
  liningColour,
  fittingName,
  fittingHint,
  unitPrice,
  candidates,
  step,
}: Props) {
  const fabricSrc = fabric?.imageUrl || fabric?.swatchUrl || null;
  const liningHex = liningSwatchHex(liningName, liningColour);
  const title = formatShadeTitle(shapeName);

  const shapeHero = useMemo(
    () => pickShapeReference(candidates, shapeImage) || FALLBACK,
    [candidates, shapeImage]
  );

  const reviewSrc = useMemo(
    () =>
      pickCatalogMatch(candidates, fabric) ||
      shapeHero,
    [candidates, fabric, shapeHero]
  );

  const showFabricOnly = step === 1 && Boolean(fabricSrc);
  const showReview = step === 5;
  const previewSrc = showFabricOnly
    ? fabricSrc!
    : showReview
      ? reviewSrc
      : shapeHero;

  const scale =
    step === 2 ? sizePreviewScale(diameterCm) : 1;

  const eyebrow =
    step === 0
      ? "Choose silhouette"
      : step === 1
        ? "Selected fabric"
        : step === 2
          ? "Size on your shade"
          : step === 3
            ? "Lining on your shade"
            : step === 4
              ? "Fitting"
              : step === 5
                ? "Your configuration"
                : "Live preview";

  return (
    <div className="relative aspect-[4/5] overflow-hidden studio-preview-frame">
      {!ready ? (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      ) : (
        <div
          className={`studio-preview-photo ${showFabricOnly ? "studio-preview-fabric-only" : ""}`}
          style={
            !showFabricOnly && step === 2
              ? { transform: `scale(${scale})`, transition: "transform 0.45s ease" }
              : undefined
          }
        >
          <MediaImage
            key={previewSrc}
            src={previewSrc}
            alt={
              showFabricOnly
                ? fabric?.name || "Selected fabric"
                : `${title}${fabric?.name ? ` · ${fabric.name}` : ""}`
            }
            fill
            className="object-cover object-center"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
          {step === 3 && liningName && (
            <div
              className="studio-preview-lining-wash"
              style={{
                background: `radial-gradient(ellipse 55% 38% at 50% 92%, ${liningHex}99 0%, transparent 68%)`,
              }}
            />
          )}
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.82)] via-[rgba(20,17,14,0.38)] to-transparent text-white z-[2]">
        <p className="eyebrow text-champagne mb-2">{eyebrow}</p>

        {showFabricOnly ? (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {fabric?.name || "Fabric"}
            </p>
            {(fabric?.material || fabric?.colour) && (
              <p className="text-sm text-white/80 mt-1">
                {[fabric?.material, fabric?.colour].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-xs text-white/55 mt-1">For {title}</p>
          </>
        ) : step === 3 ? (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {liningName || "Lining"}
            </p>
            <p className="text-sm text-white/80 mt-1">
              Inner lining · {title}
              {fabric?.name ? ` · ${fabric.name}` : ""}
            </p>
            {sizeName && (
              <p className="text-xs text-white/65 mt-1">
                {sizeName}
                {diameterCm != null ? ` · Ø ${diameterCm} cm` : ""}
              </p>
            )}
          </>
        ) : step === 4 ? (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {fittingName || "Fitting"}
            </p>
            <p className="text-sm text-white/80 mt-1">
              {fittingHint || `For ${title}`}
            </p>
            {fabric?.name && (
              <p className="text-xs text-white/65 mt-1">{fabric.name}</p>
            )}
          </>
        ) : step === 2 ? (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {sizeName || "Size"}
            </p>
            <p className="text-sm text-white/80 mt-1">
              {[
                diameterCm != null ? `Ø ${diameterCm} cm` : null,
                heightCm != null ? `H ${heightCm} cm` : null,
                title,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {fabric?.name && (
              <p className="text-xs text-white/65 mt-1">{fabric.name}</p>
            )}
          </>
        ) : (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {title}
            </p>
            {fabric?.name && (
              <p className="text-sm text-white/80 mt-1">{fabric.name}</p>
            )}
            {(sizeName || liningName) && step >= 2 && (
              <p className="text-xs text-white/65 mt-1">
                {[
                  sizeName,
                  diameterCm != null ? `Ø ${diameterCm} cm` : null,
                  liningName,
                  step >= 4 ? fittingName : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </>
        )}

        <div className="mt-3 flex items-center gap-3">
          <p className="text-lg tracking-wide">{formatMoney(unitPrice)}</p>
          {liningName && step >= 3 && (
            <span
              className={`studio-preview-lining-chip ${step === 3 ? "is-emphasis" : ""}`}
              style={{ background: liningHex }}
              title={`Lining: ${liningName}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
