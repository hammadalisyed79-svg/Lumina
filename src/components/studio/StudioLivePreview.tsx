"use client";

import { useMemo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import { liningSwatchHex } from "@/lib/studio/images";
import {
  pickPreviewImage,
  shapeClipPath,
  sizePreviewScale,
  type PreviewCandidate,
} from "@/lib/studio/preview";

const FALLBACK = "/media/homepage/hero-lifestyle.png";

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
  fittingName?: string | null;
  showFitting?: boolean;
  unitPrice: number;
  candidates: PreviewCandidate[];
  step: number;
};

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
  fittingName,
  showFitting,
  unitPrice,
  candidates,
  step,
}: Props) {
  const fabricSrc = fabric?.imageUrl || fabric?.swatchUrl || null;
  const liningHex = liningSwatchHex(liningName, liningColour);
  const clip = shapeClipPath(shapeKey);
  const scale = sizePreviewScale(diameterCm);

  const formSrc = useMemo(
    () =>
      pickPreviewImage(candidates, fabric, [shapeImage, FALLBACK]) || FALLBACK,
    [candidates, fabric, shapeImage]
  );

  const mode =
    step === 0 ? "shape" : step === 3 ? "lining" : step === 4 ? "fitting" : "compose";

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-stone group studio-preview-frame">
      {!ready ? (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      ) : (
        <>
          <div className="studio-preview-stage" aria-hidden>
            <div
              className="studio-preview-shade"
              style={{ transform: `scale(${scale})` }}
            >
              {/* Catalog form for this silhouette (keyword-matched when possible) */}
              <div className="studio-preview-form">
                <MediaImage
                  key={formSrc}
                  src={formSrc}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1024px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Fabric cloth mapped onto the silhouette */}
              {fabricSrc && mode !== "shape" && (
                <div
                  className="studio-preview-fabric"
                  style={{ clipPath: clip }}
                >
                  <MediaImage
                    key={fabricSrc}
                    src={fabricSrc}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width:1024px) 100vw, 50vw"
                  />
                  <span className="studio-preview-fabric-shade" />
                </div>
              )}

              {/* Inner lining wash through the open base */}
              {mode !== "shape" && (
                <div
                  className="studio-preview-lining"
                  style={{
                    clipPath: clip,
                    background: `radial-gradient(ellipse 70% 45% at 50% 88%, ${liningHex}cc 0%, ${liningHex}55 35%, transparent 70%)`,
                  }}
                />
              )}

              {/* Soft rim light so the form reads as a shade */}
              <div className="studio-preview-rim" style={{ clipPath: clip }} />
            </div>
          </div>

          <div className="studio-preview-vignette" />
        </>
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.82)] via-[rgba(20,17,14,0.38)] to-transparent text-white z-[2]">
        <p className="eyebrow text-champagne mb-2">Live preview</p>
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
        <div className="mt-3 flex items-center gap-3">
          <p className="text-lg tracking-wide">{formatMoney(unitPrice)}</p>
          {liningName && mode !== "shape" && (
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
