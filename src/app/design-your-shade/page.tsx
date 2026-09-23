"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { calculateUnitPrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";

type Opt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  imageUrl?: string | null;
  description?: string;
  diameterCm?: number | null;
  heightCm?: number | null;
};
type Shape = {
  key: string;
  name: string;
  basePrice: number;
  imageUrl?: string | null;
  description?: string;
};

const STEPS = ["Shape", "Fabric", "Size", "Lining", "Fitting", "Review"] as const;
const FALLBACK_PREVIEW =
  "/media/products/handmade-by-order-luxury-teal-golden-wave-pattern-abstract-art-print-on-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes/03-83136991330682.jpg";

function usableImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes(".heic") || url.includes("placeholder")) return null;
  return url;
}

export default function DesignYourShadePage() {
  const { addConfigured, setDrawerOpen } = useCart();
  const [step, setStep] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [fabrics, setFabrics] = useState<Opt[]>([]);
  const [sizes, setSizes] = useState<Opt[]>([]);
  const [linings, setLinings] = useState<Opt[]>([]);
  const [fittings, setFittings] = useState<Opt[]>([]);
  const [shapeKey, setShapeKey] = useState("drum");
  const [fabricId, setFabricId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [liningId, setLiningId] = useState("");
  const [fittingId, setFittingId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config-options")
      .then((r) => r.json())
      .then((d) => {
        setShapes(d.shapes || []);
        setFabrics(d.fabrics || []);
        setSizes(d.sizes || []);
        setLinings(d.linings || []);
        setFittings(d.fittings || []);
        setShapeKey(d.shapes?.[0]?.key || "drum");
        setFabricId(d.fabrics?.[0]?.id || "");
        setSizeId(d.sizes?.[1]?.id || d.sizes?.[0]?.id || "");
        setLiningId(d.linings?.[0]?.id || "");
        setFittingId(d.fittings?.[0]?.id || "");
      });
  }, []);

  const shape = shapes.find((s) => s.key === shapeKey);
  const fabric = fabrics.find((f) => f.id === fabricId);
  const size = sizes.find((s) => s.id === sizeId);
  const lining = linings.find((l) => l.id === liningId);
  const fitting = fittings.find((f) => f.id === fittingId);

  const unitPrice = useMemo(() => {
    if (!shape) return 0;
    return calculateUnitPrice({
      basePrice: shape.basePrice,
      fabricMod: fabric?.priceMod,
      sizeMod: size?.priceMod,
      liningMod: lining?.priceMod,
      fittingMod: fitting?.priceMod,
    });
  }, [shape, fabric, size, lining, fitting]);

  const previewSrc =
    usableImage(fabric?.imageUrl) ||
    usableImage(shape?.imageUrl) ||
    usableImage(shapes.find((s) => usableImage(s.imageUrl))?.imageUrl) ||
    FALLBACK_PREVIEW;

  async function saveDesign() {
    if (!shape || !fabric || !size || !lining || !fitting) return;
    const res = await fetch("/api/saved-designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${shape.name} / ${fabric.name}`,
        shapeKey: shape.key,
        fabricSlug: fabric.slug,
        sizeSlug: size.slug,
        liningSlug: lining.slug,
        fittingSlug: fitting.slug,
        unitPrice,
      }),
    });
    if (res.ok) setSaved(true);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="bg-paper">
      <div className="border-b border-line bg-ivory/70">
        <div className="container-site py-10 md:py-14 max-w-3xl">
          <p className="eyebrow mb-3">{COPY.designPage.eyebrow}</p>
          <h1 className="section-title mb-3">{COPY.designPage.title}</h1>
          <div className="lux-rule" />
          <p className="prose-muted">{COPY.designPage.body}</p>
        </div>
      </div>

      <div className="container-site py-10 md:py-14">
        <div className="mb-8 md:mb-10">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-xs tracking-[0.16em] uppercase text-muted">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="text-xs tracking-[0.14em] uppercase text-bronze hidden sm:block">
              {STEPS[step]}
            </p>
          </div>
          <div className="h-px bg-line overflow-hidden">
            <div
              className="h-full bg-bronze transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i)}
                className={`px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors ${
                  step === i
                    ? "bg-ink text-ivory"
                    : i < step
                      ? "bg-stone text-ink"
                      : "text-muted hover:text-ink"
                }`}
              >
                <span className="sm:hidden">{i + 1}</span>
                <span className="hidden sm:inline">
                  {i + 1}. {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone group">
              <Image
                src={previewSrc}
                alt="Shade preview"
                fill
                unoptimized
                className="object-cover object-center img-zoom"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.78)] via-[rgba(20,17,14,0.35)] to-transparent text-white">
                <p className="eyebrow text-champagne mb-2">Live preview</p>
                <p className="font-display text-3xl md:text-4xl tracking-tight">
                  {shape?.name || "Shade"}
                </p>
                <p className="text-sm text-white/80 mt-1">{fabric?.name}</p>
                <p className="mt-3 text-lg tracking-wide">{formatMoney(unitPrice)}</p>
              </div>
            </div>
          </div>

          <div>
            {step === 0 && (
              <OptionGrid
                label="Choose a silhouette"
                options={shapes.map((s) => ({
                  id: s.key,
                  name: s.name,
                  meta: s.description,
                  image: usableImage(s.imageUrl) || undefined,
                }))}
                value={shapeKey}
                onChange={setShapeKey}
              />
            )}
            {step === 1 && (
              <OptionGrid
                label="Choose a fabric"
                options={fabrics.map((f) => ({
                  id: f.id,
                  name: f.name,
                  meta: f.priceMod ? `+£${f.priceMod}` : "Included",
                  image: usableImage(f.imageUrl) || undefined,
                }))}
                value={fabricId}
                onChange={setFabricId}
              />
            )}
            {step === 2 && (
              <OptionGrid
                label="Choose a size"
                options={sizes.map((s) => ({
                  id: s.id,
                  name: s.name,
                  meta: s.priceMod ? `+£${s.priceMod}` : "Base size",
                }))}
                value={sizeId}
                onChange={setSizeId}
              />
            )}
            {step === 3 && (
              <OptionGrid
                label="Choose a lining"
                options={linings.map((l) => ({
                  id: l.id,
                  name: l.name,
                  meta: l.priceMod ? `+£${l.priceMod}` : "Included",
                }))}
                value={liningId}
                onChange={setLiningId}
              />
            )}
            {step === 4 && (
              <OptionGrid
                label="Choose a fitting"
                options={fittings.map((f) => ({
                  id: f.id,
                  name: f.name,
                  meta: f.description || (f.priceMod ? `+£${f.priceMod}` : "Included"),
                }))}
                value={fittingId}
                onChange={setFittingId}
              />
            )}
            {step === 5 && (
              <div className="surface-panel p-6 md:p-8 space-y-5">
                <div>
                  <p className="eyebrow mb-2">Review</p>
                  <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                    Your configuration
                  </h2>
                  <div className="lux-rule" />
                </div>
                <dl className="space-y-3 text-[15px]">
                  {[
                    ["Shape", shape?.name],
                    ["Fabric", fabric?.name],
                    ["Size", size?.name],
                    ["Lining", lining?.name],
                    ["Fitting", fitting?.name],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line/80 pb-2">
                      <dt className="text-muted text-xs tracking-[0.12em] uppercase">{k}</dt>
                      <dd className="text-right">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 pt-2 font-medium text-lg">
                    <dt>Total</dt>
                    <dd>{formatMoney(unitPrice)}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!shape || !fabric || !size || !lining || !fitting) return;
                      addConfigured({
                        title: `Custom ${shape.name} · ${fabric.name}`,
                        imageUrl: previewSrc,
                        quantity: 1,
                        config: {
                          shapeKey: shape.key,
                          shapeName: shape.name,
                          fabricSlug: fabric.slug,
                          fabricName: fabric.name,
                          sizeSlug: size.slug,
                          sizeName: size.name,
                          liningSlug: lining.slug,
                          liningName: lining.name,
                          fittingSlug: fitting.slug,
                          fittingName: fitting.name,
                          unitPrice,
                        },
                      });
                      setDrawerOpen(true);
                    }}
                  >
                    Add to bag
                  </button>
                  <Link
                    href={`/shop/lampshades?q=${encodeURIComponent(fabric?.name?.split(" ").slice(0, 3).join(" ") || "")}`}
                    className="btn-secondary"
                  >
                    Matching shades
                  </Link>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-quiet"
                  >
                    WhatsApp
                  </a>
                  <button type="button" className="btn-quiet" onClick={saveDesign}>
                    Save design
                  </button>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Made to order in Britain. Pay securely with Stripe — shipping is calculated at
                  checkout from studio rates.
                </p>
                {saved && (
                  <p className="text-sm text-bronze">Design saved to your account.</p>
                )}
              </div>
            )}

            <div className="flex justify-between mt-10 pt-6 border-t border-line">
              <button
                type="button"
                className="btn-secondary"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionGrid({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string; meta?: string | null; image?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">{label}</h2>
      <div className="lux-rule" />
      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`studio-option ${value === o.id ? "is-selected" : ""}`}
          >
            {o.image && (
              <div className="relative h-28 mb-3 bg-stone overflow-hidden">
                <Image
                  src={o.image}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="200px"
                />
              </div>
            )}
            <p className="font-medium text-[15px]">{o.name}</p>
            {o.meta && <p className="text-sm text-muted mt-1.5 leading-snug">{o.meta}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
