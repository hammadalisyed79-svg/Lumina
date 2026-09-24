"use client";

import { useMemo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import { liningSwatchHex } from "@/lib/studio/images";
import {
  pickShapeReference,
  studioPreviewApiPath,
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
  liningName?: string | null;
  liningColour?: string | null;
  liningSlug?: string | null;
  fittingName?: string | null;
  showFitting?: boolean;
  unitPrice: number;
  candidates: PreviewCandidate[];
  step: number;
};

/**
 * Single-image live preview:
 * - Shape step → catalog silhouette photo
 * - Fabric step → fabric cloth only
 * - Later steps → server-generated combination PNG (no overlays)
 */
export function StudioLivePreview({
  ready,
  shapeKey,
  shapeName,
  shapeImage,
  fabric,
  sizeName,
  diameterCm,
  liningName,
  liningColour,
  liningSlug,
  fittingName,
  showFitting,
  unitPrice,
  candidates,
  step,
}: Props) {
  const fabricSrc = fabric?.imageUrl || fabric?.swatchUrl || null;
  const liningHex = liningSwatchHex(liningName, liningColour);

  const shapeRef = useMemo(
    () => pickShapeReference(candidates, shapeImage),
    [candidates, shapeImage]
  );

  const composedSrc = useMemo(() => {
    if (!fabric?.slug) return null;
    return studioPreviewApiPath({
      shape: shapeKey,
      fabric: fabric.slug,
      lining: liningSlug,
      diameter: diameterCm,
    });
  }, [shapeKey, fabric?.slug, liningSlug, diameterCm]);

  const showFabricOnly = step === 1 && Boolean(fabricSrc);
  const showShapeOnly = step === 0;
  const showComposed = step >= 2 && Boolean(composedSrc);

  const previewSrc = showFabricOnly
    ? fabricSrc
    : showShapeOnly
      ? shapeRef
      : showComposed
        ? composedSrc
        : composedSrc || fabricSrc || shapeRef;

  const unoptimized = Boolean(previewSrc?.startsWith("/api/"));

  return (
    <div className="relative aspect-[4/5] overflow-hidden studio-preview-frame">
      {!ready || !previewSrc ? (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      ) : (
        <div
          className={`studio-preview-photo ${showFabricOnly ? "studio-preview-fabric-only" : ""}`}
        >
          <MediaImage
            key={previewSrc}
            src={previewSrc!}
            alt={
              showFabricOnly
                ? fabric?.name || "Selected fabric"
                : `${shapeName || "Shade"} in ${fabric?.name || "fabric"}`
            }
            fill
            className="object-cover object-center"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
            unoptimized={unoptimized}
          />
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.82)] via-[rgba(20,17,14,0.38)] to-transparent text-white z-[2]">
        <p className="eyebrow text-champagne mb-2">
          {showFabricOnly ? "Selected fabric" : "Live preview"}
        </p>
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
            <p className="text-xs text-white/55 mt-1">
              For {shapeName || "your shade"}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {shapeName || "Shade"}
            </p>
            <p className="text-sm text-white/80 mt-1">{fabric?.name}</p>
            {sizeName && (
              <p className="text-xs text-white/65 mt-1">
                {sizeName}
                {diameterCm != null ? ` · Ø ${diameterCm} cm` : ""}
                {liningName ? ` · ${liningName}` : ""}
              </p>
            )}
            {showFitting && fittingName && (
              <p className="text-xs text-white/55 mt-0.5">{fittingName}</p>
            )}
          </>
        )}
        <div className="mt-3 flex items-center gap-3">
          <p className="text-lg tracking-wide">{formatMoney(unitPrice)}</p>
          {liningName && step > 1 && (
            <span
              className="studio-preview-lining-chip"
              style={{ background: liningHex }}
              title={`Lining: ${liningName}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
