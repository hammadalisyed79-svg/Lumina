"use client";

import { useId, useMemo } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/image";
import { liningSwatchHex } from "@/lib/studio/images";
import {
  pickCatalogMatch,
  pickShapeReference,
  shapePath,
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
  const uid = useId().replace(/:/g, "");
  const fabricSrc = fabric?.imageUrl || fabric?.swatchUrl || null;
  const fabricHref = fabricSrc ? normalizeImageSrc(fabricSrc) : null;
  const liningHex = liningSwatchHex(liningName, liningColour);
  const path = shapePath(shapeKey);
  const scale = sizePreviewScale(diameterCm);
  const fabricPatId = `fabric-pat-${uid}`;

  const catalogMatch = useMemo(
    () => pickCatalogMatch(candidates, fabric),
    [candidates, fabric]
  );

  const shapeRef = useMemo(
    () => pickShapeReference(candidates, shapeImage),
    [candidates, shapeImage]
  );

  /** Shape step: catalog silhouette photo. Later: match photo OR SVG composite. */
  const showPhotoOnly = step === 0 || Boolean(catalogMatch);
  const photoSrc = step === 0 ? shapeRef : catalogMatch;
  const showComposite = !showPhotoOnly && Boolean(fabricHref);

  return (
    <div className="relative aspect-[4/5] overflow-hidden studio-preview-frame">
      {!ready ? (
        <div className="absolute inset-0 animate-pulse bg-stone" />
      ) : (
        <>
          {showPhotoOnly && photoSrc ? (
            <div className="studio-preview-photo">
              <MediaImage
                key={photoSrc}
                src={photoSrc}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width:1024px) 100vw, 50vw"
                priority
              />
              {step > 0 && (
                <div
                  className="studio-preview-lining-wash"
                  style={{
                    background: `radial-gradient(ellipse 55% 40% at 50% 92%, ${liningHex}99 0%, transparent 65%)`,
                  }}
                />
              )}
            </div>
          ) : null}

          {showComposite ? (
            <div className="studio-preview-stage" aria-hidden>
              <div
                className="studio-preview-shade"
                style={{ transform: `scale(${scale})` }}
              >
                <svg
                  className="studio-preview-svg"
                  viewBox="0 0 100 120"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`${shapeName || "Shade"} in ${fabric?.name || "fabric"}`}
                >
                  <defs>
                    <pattern
                      id={fabricPatId}
                      patternUnits="userSpaceOnUse"
                      width="100"
                      height="120"
                    >
                      <image
                        href={fabricHref!}
                        x="0"
                        y="0"
                        width="100"
                        height="120"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </pattern>
                    <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
                      <stop offset="22%" stopColor="#000" stopOpacity="0.05" />
                      <stop offset="50%" stopColor="#fff" stopOpacity="0.12" />
                      <stop offset="78%" stopColor="#000" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
                    </linearGradient>
                    <linearGradient id={`${uid}-vert`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                      <stop offset="35%" stopColor="#000" stopOpacity="0" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
                    </linearGradient>
                    <radialGradient id={`${uid}-lining`} cx="50%" cy="92%" r="45%">
                      <stop offset="0%" stopColor={liningHex} stopOpacity="0.85" />
                      <stop offset="55%" stopColor={liningHex} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={liningHex} stopOpacity="0" />
                    </radialGradient>
                    <filter id={`${uid}-soft`} x="-8%" y="-8%" width="116%" height="116%">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="3"
                        floodColor="#14110e"
                        floodOpacity="0.28"
                      />
                    </filter>
                  </defs>

                  {/* Soft hanging cord */}
                  <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="10"
                    stroke="#8a8174"
                    strokeWidth="0.6"
                    opacity="0.55"
                  />

                  <g filter={`url(#${uid}-soft)`}>
                    <path d={path} fill={`url(#${fabricPatId})`} />
                    <path d={path} fill={`url(#${uid}-cyl)`} />
                    <path d={path} fill={`url(#${uid}-vert)`} />
                    <path d={path} fill={`url(#${uid}-lining)`} />
                    <path
                      d={path}
                      fill="none"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="0.4"
                    />
                  </g>
                </svg>
              </div>
            </div>
          ) : null}

          {!showPhotoOnly && !showComposite && shapeRef ? (
            <div className="studio-preview-photo">
              <MediaImage
                key={shapeRef}
                src={shapeRef}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width:1024px) 100vw, 50vw"
                priority
              />
            </div>
          ) : null}

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
          {liningName && step > 0 && (
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
