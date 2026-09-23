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

  return (
    <div className="container-site py-10 md:py-14">
      <p className="eyebrow mb-2">{COPY.designPage.eyebrow}</p>
      <h1 className="font-display text-4xl md:text-5xl mb-3">{COPY.designPage.title}</h1>
      <p className="prose-muted max-w-2xl mb-10">{COPY.designPage.body}</p>

      <div className="flex flex-wrap gap-2 mb-8 md:mb-10">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs tracking-wide uppercase border ${
              step === i
                ? "border-[color:var(--ink)] bg-[color:var(--ink)] text-white"
                : "border-[color:var(--line)]"
            }`}
          >
            <span className="sm:hidden">{i + 1}</span>
            <span className="hidden sm:inline">
              {i + 1}. {label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="relative aspect-[4/5] bg-[color:var(--stone)]">
          <Image
            src={previewSrc}
            alt="Shade preview"
            fill
            unoptimized
            className="object-cover object-center"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
          <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/55 to-transparent text-white">
            <p className="font-display text-3xl">{shape?.name || "Shade"}</p>
            <p className="text-sm text-white/85">{fabric?.name}</p>
            <p className="mt-2 text-lg">{formatMoney(unitPrice)}</p>
          </div>
        </div>

        <div>
          {step === 0 && (
            <OptionGrid
              label="Choose a shape"
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
            <div className="space-y-4 border border-[color:var(--line)] p-6 bg-white/60">
              <h2 className="font-display text-3xl">Your configuration</h2>
              <ul className="space-y-2 text-[15px]">
                <li>Shape: {shape?.name}</li>
                <li>Fabric: {fabric?.name}</li>
                <li>Size: {size?.name}</li>
                <li>Lining: {lining?.name}</li>
                <li>Fitting: {fitting?.name}</li>
                <li className="font-medium pt-2">Price: {formatMoney(unitPrice)}</li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-4">
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
                  Shop matching shades
                </Link>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  WhatsApp
                </a>
                <button type="button" className="btn-ghost" onClick={saveDesign}>
                  Save design
                </button>
              </div>
              <p className="text-xs text-[color:var(--muted)]">
                Pay on this site with Stripe. Studio price updates as you choose options.
              </p>
              {saved && (
                <p className="text-sm text-[color:var(--muted)]">
                  Design saved to your account / guest key.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
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
      <h2 className="font-display text-3xl mb-6">{label}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`text-left border p-4 transition-colors ${
              value === o.id
                ? "border-[color:var(--ink)] bg-white"
                : "border-[color:var(--line)] hover:border-[color:var(--bronze)]"
            }`}
          >
            {o.image && (
              <div className="relative h-24 mb-3 bg-[color:var(--stone)] overflow-hidden">
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
            <p className="font-medium">{o.name}</p>
            {o.meta && <p className="text-sm text-[color:var(--muted)] mt-1">{o.meta}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
