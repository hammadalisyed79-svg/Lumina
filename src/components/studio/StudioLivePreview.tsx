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
 * - Shape step: exact catalog photo
 * - Fabric step: fabric cloth only
 * - Later steps: same catalog photo with selected fabric colour applied
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

  const resultSrc = useMemo(() => {
    if (!fabric?.slug) return null;
    return studioPreviewApiPath({
      shape: shapeKey,
      fabric: fabric.slug,
      lining: liningSlug,
      diameter: diameterCm,
      base: shapeRef || shapeImage || null,
    });
  }, [shapeKey, fabric?.slug, liningSlug, diameterCm, shapeRef, shapeImage]);

  const showFabricOnly = step === 1 && Boolean(fabricSrc);
  const showShapeOnly = step === 0;
  const showResult = step >= 2 && Boolean(resultSrc);

  const shadeTitle = shapeName
    ? /lampshade|pendant/i.test(shapeName)
      ? shapeName
      : `${shapeName} lampshade`
    : "Lampshade";

  const previewSrc = showFabricOnly
    ? fabricSrc
    : showShapeOnly
      ? shapeRef
      : showResult
        ? resultSrc
        : resultSrc || shapeRef || fabricSrc;

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
                : `${shadeTitle} in ${fabric?.name || "fabric"}`
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
          {showFabricOnly
            ? "Selected fabric"
            : showResult
              ? "Your lampshade"
              : "Live preview"}
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
            <p className="text-xs text-white/55 mt-1">For {shadeTitle}</p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {shadeTitle}
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
          {liningName && step >= 2 && (
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
