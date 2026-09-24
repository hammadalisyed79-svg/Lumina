"use client";

import { useMemo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { ShadeProductPreview } from "@/components/studio/ShadeProductPreview";
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
 * Live preview by step:
 * - Shape → catalog photo
 * - Fabric → cloth only
 * - Size / lining / fitting / review → live SVG lampshade (category product)
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

  const showFabricOnly = step === 1 && Boolean(fabricSrc);
  const showShapeOnly = step === 0;
  const showProduct =
    step >= 2 && Boolean(fabricSrc) && Boolean(shapeKey);

  const shadeTitle = shapeName
    ? /lampshade|pendant/i.test(shapeName)
      ? shapeName
      : `${shapeName} lampshade`
    : "Lampshade";

  const stepEyebrow = showFabricOnly
    ? "Selected fabric"
    : step === 3
      ? "Lining on your shade"
      : step === 4
        ? "Fitting detail"
        : showProduct
          ? "Your lampshade"
          : "Live preview";

  return (
    <div className="relative aspect-[4/5] overflow-hidden studio-preview-frame">
      {!ready ? (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      ) : showProduct && fabricSrc ? (
        <ShadeProductPreview
          shapeKey={shapeKey}
          fabricUrl={fabricSrc}
          liningName={liningName}
          liningColour={liningColour}
          diameterCm={diameterCm}
          emphasizeLining={step === 3}
          emphasizeFitting={step === 4}
        />
      ) : showFabricOnly && fabricSrc ? (
        <div className="studio-preview-photo studio-preview-fabric-only">
          <MediaImage
            key={fabricSrc}
            src={fabricSrc}
            alt={fabric?.name || "Selected fabric"}
            fill
            className="object-cover object-center"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
        </div>
      ) : showShapeOnly && shapeRef ? (
        <div className="studio-preview-photo">
          <MediaImage
            key={shapeRef}
            src={shapeRef}
            alt={shadeTitle}
            fill
            className="object-cover object-center"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
        </div>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.82)] via-[rgba(20,17,14,0.38)] to-transparent text-white z-[2]">
        <p className="eyebrow text-champagne mb-2">{stepEyebrow}</p>
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
        ) : step === 3 ? (
          <>
            <p className="font-display text-2xl md:text-3xl tracking-tight">
              {liningName || "Lining"}
            </p>
            <p className="text-sm text-white/80 mt-1">
              Inside {shadeTitle}
              {fabric?.name ? ` · ${fabric.name}` : ""}
            </p>
            {sizeName && (
              <p className="text-xs text-white/65 mt-1">
                {sizeName}
                {diameterCm != null ? ` · Ø ${diameterCm} cm` : ""}
              </p>
            )}
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
              className={`studio-preview-lining-chip ${step === 3 ? "is-emphasis" : ""}`}
              style={{ background: liningHex }}
              title={`Lining: ${liningName}`}
            />
          )}
        </div>
      </div>

      {/* Hidden prefetch for cart/save thumbnail */}
      {fabric?.slug && step >= 2 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={studioPreviewApiPath({
            shape: shapeKey,
            fabric: fabric.slug,
            lining: liningSlug,
            diameter: diameterCm,
          })}
          alt=""
          className="sr-only"
          aria-hidden
        />
      )}
    </div>
  );
}
