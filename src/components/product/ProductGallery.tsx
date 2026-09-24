"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { MediaImage } from "@/components/media/MediaImage";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

export function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => setLightbox(false), []);
  useFocusTrap(lightbox, panelRef, close);

  const list = images.length
    ? images
    : [{ id: "ph", url: "/demo-assets/products/placeholder.svg", alt: title }];
  const current = list[Math.min(active, list.length - 1)] || list[0];

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((i) => (i + 1) % list.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => (i - 1 + list.length) % list.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, list.length]);

  function openAt(index: number) {
    setActive(index);
    setLightbox(true);
  }

  return (
    <div className="pdp-gallery">
      <button
        type="button"
        className="pdp-gallery-main"
        onClick={() => openAt(active)}
        aria-label="Open image gallery"
      >
        <MediaImage
          src={current.url}
          alt={current.alt || title}
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
        />
        <span className="pdp-gallery-expand">
          <Expand size={16} strokeWidth={1.75} aria-hidden />
          View
        </span>
      </button>

      {list.length > 1 && (
        <div className="pdp-gallery-thumbs" role="list">
          {list.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              className={`pdp-gallery-thumb ${idx === active ? "is-active" : ""}`}
              onClick={() => setActive(idx)}
              onDoubleClick={() => openAt(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-current={idx === active}
            >
              <MediaImage
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="pdp-lightbox">
          <button
            type="button"
            className="pdp-lightbox-backdrop"
            aria-label="Close gallery"
            onClick={close}
          />
          <div
            ref={panelRef}
            className="pdp-lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="pdp-lightbox-top">
              <p id={titleId} className="pdp-lightbox-title">
                {title}
                <span className="text-muted">
                  {" "}
                  · {active + 1} / {list.length}
                </span>
              </p>
              <button
                type="button"
                className="pdp-lightbox-close focus-ring"
                aria-label="Close"
                onClick={close}
              >
                <X size={22} />
              </button>
            </div>
            <div className="pdp-lightbox-stage">
              {list.length > 1 && (
                <button
                  type="button"
                  className="pdp-lightbox-nav is-prev"
                  aria-label="Previous image"
                  onClick={() => setActive((i) => (i - 1 + list.length) % list.length)}
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <div className="pdp-lightbox-image">
                <MediaImage
                  src={current.url}
                  alt={current.alt || title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              {list.length > 1 && (
                <button
                  type="button"
                  className="pdp-lightbox-nav is-next"
                  aria-label="Next image"
                  onClick={() => setActive((i) => (i + 1) % list.length)}
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
