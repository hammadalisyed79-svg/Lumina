"use client";

import { useEffect, useId } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import type { FabricOpt } from "@/lib/configurator/types";

type Props = {
  fabric: FabricOpt | null;
  onClose: () => void;
  zoomOnShade?: boolean;
  fabricUrl?: string | null;
};

export function FabricLightbox({ fabric, onClose, zoomOnShade, fabricUrl }: Props) {
  const titleId = useId();
  const open = Boolean(fabric) || zoomOnShade;
  const img = fabric?.imageUrl || fabric?.swatchUrl || fabricUrl;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cfg-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="cfg-lightbox-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="eyebrow mb-1">Fabric</p>
            <h2 id={titleId} className="font-display text-2xl tracking-tight">
              {fabric?.name || "Fabric detail"}
            </h2>
            {fabric?.material && (
              <p className="text-sm text-muted mt-1">{fabric.material}</p>
            )}
          </div>
          <button type="button" className="btn-quiet text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="relative aspect-[4/3] bg-stone overflow-hidden">
          {img ? (
            <MediaImage
              src={img}
              alt={fabric?.name || "Fabric"}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 640px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
              No image available
            </div>
          )}
        </div>
        {fabric?.description && (
          <p className="prose-muted text-sm mt-4">{fabric.description}</p>
        )}
      </div>
    </div>
  );
}
