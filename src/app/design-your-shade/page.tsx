"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { calculateUnitPrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import {
  FabricSwatchGrid,
  type FabricOpt,
} from "@/components/studio/FabricSwatchGrid";
import { StudioFittingHint, StudioSizeHint } from "@/components/studio/StudioHints";
import {
  buildStudioSharePath,
  type FabricFamily,
} from "@/lib/studio/fabric-family";

type Opt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  imageUrl?: string | null;
  swatchUrl?: string | null;
  description?: string | null;
  colour?: string | null;
  compatibility?: string | null;
  diameterCm?: number | null;
  heightCm?: number | null;
  shapeKey?: string | null;
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
const GUEST_KEY = "luminahub_studio_guest";

function usableImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes(".heic") || url.includes("placeholder")) return null;
  return url;
}

function guestKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let key = localStorage.getItem(GUEST_KEY);
    if (!key) {
      key = `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(GUEST_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

export default function DesignYourShadePage() {
  return (
    <Suspense
      fallback={
        <div className="container-site section-pad">
          <p className="eyebrow mb-3">Atelier</p>
          <h1 className="section-title">Design your shade</h1>
          <p className="prose-muted mt-4">Loading the studio…</p>
        </div>
      }
    >
      <DesignStudioInner />
    </Suspense>
  );
}

function DesignStudioInner() {
  const { addConfigured, setDrawerOpen } = useCart();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [fabrics, setFabrics] = useState<FabricOpt[]>([]);
  const [sizes, setSizes] = useState<Opt[]>([]);
  const [linings, setLinings] = useState<Opt[]>([]);
  const [fittings, setFittings] = useState<Opt[]>([]);
  const [shapeKey, setShapeKey] = useState("drum");
  const [fabricId, setFabricId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [liningId, setLiningId] = useState("");
  const [fittingId, setFittingId] = useState("");
  const [fabricFilter, setFabricFilter] = useState<FabricFamily>("all");
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadOptions = useCallback(() => {
    setLoadError(false);
    setReady(false);
    fetch("/api/config-options")
      .then((r) => {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then((d) => {
        const nextShapes: Shape[] = d.shapes || [];
        const nextFabrics: FabricOpt[] = d.fabrics || [];
        const nextSizes: Opt[] = d.sizes || [];
        const nextLinings: Opt[] = d.linings || [];
        const nextFittings: Opt[] = d.fittings || [];
        setShapes(nextShapes);
        setFabrics(nextFabrics);
        setSizes(nextSizes);
        setLinings(nextLinings);
        setFittings(nextFittings);

        const qShape = searchParams.get("shape");
        const qFabric = searchParams.get("fabric");
        const qSize = searchParams.get("size");
        const qLining = searchParams.get("lining");
        const qFitting = searchParams.get("fitting");
        const qStep = Number(searchParams.get("step") || "");

        const shapeOk = nextShapes.find((s) => s.key === qShape);
        const fabricOk = nextFabrics.find((f) => f.slug === qFabric || f.id === qFabric);
        const sizeOk = nextSizes.find((s) => s.slug === qSize || s.id === qSize);
        const liningOk = nextLinings.find((l) => l.slug === qLining || l.id === qLining);
        const fittingOk = nextFittings.find((f) => f.slug === qFitting || f.id === qFitting);

        const nextShape = shapeOk?.key || nextShapes[0]?.key || "drum";
        setShapeKey(nextShape);
        setFabricId(fabricOk?.id || nextFabrics[0]?.id || "");
        setLiningId(liningOk?.id || nextLinings[0]?.id || "");
        setFittingId(fittingOk?.id || nextFittings[0]?.id || "");

        const sizedForShape = nextSizes.filter(
          (s) => !s.shapeKey || s.shapeKey === nextShape
        );
        const pool = sizedForShape.length ? sizedForShape : nextSizes;
        const sizeMatch = pool.find((s) => s.id === sizeOk?.id || s.slug === qSize);
        setSizeId(sizeMatch?.id || pool[1]?.id || pool[0]?.id || "");

        if (Number.isFinite(qStep) && qStep >= 0 && qStep < STEPS.length) {
          setStep(qStep);
        } else if (shapeOk && fabricOk && sizeOk && liningOk && fittingOk) {
          setStep(5);
        }
        setReady(true);
      })
      .catch(() => {
        setLoadError(true);
        setReady(true);
      });
  }, [searchParams]);

  useEffect(() => {
    loadOptions();
    // Deep-link once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shape = shapes.find((s) => s.key === shapeKey);
  const fabric = fabrics.find((f) => f.id === fabricId);
  const lining = linings.find((l) => l.id === liningId);
  const fitting = fittings.find((f) => f.id === fittingId);

  const sizesForShape = useMemo(() => {
    const scoped = sizes.filter((s) => !s.shapeKey || s.shapeKey === shapeKey);
    return scoped.length ? scoped : sizes;
  }, [sizes, shapeKey]);

  const size = sizesForShape.find((s) => s.id === sizeId) || sizesForShape[0];

  useEffect(() => {
    if (!sizesForShape.length) return;
    if (!sizesForShape.some((s) => s.id === sizeId)) {
      setSizeId(sizesForShape[1]?.id || sizesForShape[0].id);
    }
  }, [sizesForShape, sizeId]);

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

  const previewSrc = useMemo(() => {
    if (step === 0) {
      return (
        usableImage(shape?.imageUrl) ||
        usableImage(fabric?.swatchUrl) ||
        usableImage(fabric?.imageUrl) ||
        FALLBACK_PREVIEW
      );
    }
    if (step === 3) {
      return (
        usableImage(lining?.swatchUrl) ||
        usableImage(fabric?.swatchUrl) ||
        usableImage(fabric?.imageUrl) ||
        usableImage(shape?.imageUrl) ||
        FALLBACK_PREVIEW
      );
    }
    if (step === 4) {
      return (
        usableImage(fitting?.imageUrl) ||
        usableImage(fabric?.swatchUrl) ||
        usableImage(fabric?.imageUrl) ||
        usableImage(shape?.imageUrl) ||
        FALLBACK_PREVIEW
      );
    }
    return (
      usableImage(fabric?.swatchUrl) ||
      usableImage(fabric?.imageUrl) ||
      usableImage(shape?.imageUrl) ||
      usableImage(shapes.find((s) => usableImage(s.imageUrl))?.imageUrl) ||
      FALLBACK_PREVIEW
    );
  }, [step, shape, fabric, lining, fitting, shapes]);

  const syncUrl = useCallback(
    (nextStep = step) => {
      if (!ready || loadError) return;
      const path = buildStudioSharePath({
        shapeKey,
        fabricSlug: fabric?.slug,
        sizeSlug: size?.slug,
        liningSlug: lining?.slug,
        fittingSlug: fitting?.slug,
        step: nextStep,
      });
      router.replace(path, { scroll: false });
    },
    [
      ready,
      loadError,
      shapeKey,
      fabric?.slug,
      size?.slug,
      lining?.slug,
      fitting?.slug,
      step,
      router,
    ]
  );

  useEffect(() => {
    if (!ready || loadError) return;
    const t = setTimeout(() => syncUrl(step), 120);
    return () => clearTimeout(t);
  }, [ready, loadError, shapeKey, fabricId, sizeId, liningId, fittingId, step, syncUrl]);

  const sharePath = buildStudioSharePath({
    shapeKey,
    fabricSlug: fabric?.slug,
    sizeSlug: size?.slug,
    liningSlug: lining?.slug,
    fittingSlug: fitting?.slug,
    step: 5,
  });

  const loginHref = `/account/login?callbackUrl=${encodeURIComponent(sharePath)}`;

  async function saveDesign() {
    if (!shape || !fabric || !size || !lining || !fitting) return;
    setSaveBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
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
          previewUrl: previewSrc,
          guestKey: session?.user ? undefined : guestKey() || undefined,
        }),
      });
      if (!res.ok) {
        setSaveError("Could not save this design. Try again.");
        return;
      }
      const data = await res.json();
      setSaved(true);
      if (!data.signedIn) {
        setSaveError(null);
      }
    } catch {
      setSaveError("Could not save this design. Try again.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function shareOrCopy() {
    const url = `${window.location.origin}${sharePath}`;
    setShareNote(null);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Lumina Hub · ${shape?.name || "Shade"}`,
          text: fabric?.name
            ? `Custom ${shape?.name} in ${fabric.name}`
            : "My Lumina Hub shade design",
          url,
        });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareNote(url);
    }
  }

  function addToBag() {
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
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const canContinue = Boolean(
    (step === 0 && shapeKey) ||
      (step === 1 && fabricId) ||
      (step === 2 && sizeId) ||
      (step === 3 && liningId) ||
      (step === 4 && fittingId) ||
      step === 5
  );

  const previewMeta = (
    <>
      <p className="eyebrow text-champagne mb-2">Live preview</p>
      <p className="font-display text-3xl md:text-4xl tracking-tight">
        {shape?.name || "Shade"}
      </p>
      <p className="text-sm text-white/80 mt-1">{fabric?.name}</p>
      {size && (
        <p className="text-xs text-white/65 mt-1">
          {size.name}
          {size.diameterCm != null ? ` · Ø ${size.diameterCm} cm` : ""}
          {lining ? ` · ${lining.name}` : ""}
        </p>
      )}
      {fitting && step >= 4 && (
        <p className="text-xs text-white/55 mt-0.5">{fitting.name}</p>
      )}
      <p className="mt-3 text-lg tracking-wide">{formatMoney(unitPrice)}</p>
    </>
  );

  return (
    <div className="bg-paper studio-page">
      <div className="border-b border-line bg-ivory/70">
        <div className="container-site py-10 md:py-14 max-w-3xl">
          <p className="eyebrow mb-3">{COPY.designPage.eyebrow}</p>
          <h1 className="section-title mb-3">{COPY.designPage.title}</h1>
          <div className="lux-rule" />
          <p className="prose-muted">{COPY.designPage.body}</p>
        </div>
      </div>

      <div className="container-site py-10 md:py-14 studio-page-body">
        {loadError ? (
          <div className="surface-panel p-8 max-w-lg mx-auto text-center space-y-4">
            <p className="eyebrow">Studio</p>
            <h2 className="font-display text-3xl tracking-tight">Options unavailable</h2>
            <p className="prose-muted text-sm">
              We could not load shapes and fabrics. Check your connection and try again.
            </p>
            <button type="button" className="btn-primary" onClick={loadOptions}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 md:mb-10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-xs tracking-[0.16em] uppercase text-muted">
                  Step {step + 1} of {STEPS.length}
                  <span className="text-bronze sm:hidden"> · {STEPS[step]}</span>
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
              <div className="mt-4 studio-step-chips" role="tablist" aria-label="Design steps">
                {STEPS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={step === i}
                    onClick={() => setStep(i)}
                    className={`studio-step-chip ${
                      step === i ? "is-active" : i < step ? "is-done" : ""
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

            <div className="studio-layout">
              <div className="studio-preview-col">
                <div className="relative aspect-[4/5] overflow-hidden bg-stone group studio-preview-frame">
                  {!ready ? (
                    <div className="absolute inset-0 animate-pulse bg-stone" />
                  ) : (
                    <MediaImage
                      src={previewSrc}
                      alt="Shade preview"
                      fill
                      className="object-cover object-center img-zoom"
                      sizes="(max-width:1024px) 100vw, 50vw"
                      priority
                    />
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-[rgba(20,17,14,0.78)] via-[rgba(20,17,14,0.35)] to-transparent text-white">
                    {previewMeta}
                  </div>
                </div>
              </div>

              <div className="studio-options-col">
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
                  <FabricSwatchGrid
                    fabrics={fabrics}
                    value={fabricId}
                    onChange={setFabricId}
                    filter={fabricFilter}
                    onFilterChange={setFabricFilter}
                  />
                )}
                {step === 2 && (
                  <>
                    <OptionGrid
                      label="Choose a size"
                      options={sizesForShape.map((s) => ({
                        id: s.id,
                        name: s.name,
                        meta: [
                          s.diameterCm != null ? `Ø ${s.diameterCm} cm` : null,
                          s.heightCm != null ? `H ${s.heightCm} cm` : null,
                          s.priceMod ? `+£${s.priceMod}` : "Base size",
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }))}
                      value={size?.id || ""}
                      onChange={setSizeId}
                    />
                    <StudioSizeHint sizes={sizesForShape} />
                  </>
                )}
                {step === 3 && (
                  <OptionGrid
                    label="Choose a lining"
                    options={linings.map((l) => ({
                      id: l.id,
                      name: l.name,
                      meta: [
                        l.colour,
                        l.priceMod ? `+£${l.priceMod}` : "Included",
                      ]
                        .filter(Boolean)
                        .join(" · "),
                      image: usableImage(l.swatchUrl) || undefined,
                    }))}
                    value={liningId}
                    onChange={setLiningId}
                  />
                )}
                {step === 4 && (
                  <>
                    <OptionGrid
                      label="Choose a fitting"
                      options={fittings.map((f) => ({
                        id: f.id,
                        name: f.name,
                        meta:
                          f.description ||
                          f.compatibility ||
                          (f.priceMod ? `+£${f.priceMod}` : "Included"),
                        image: usableImage(f.imageUrl) || undefined,
                      }))}
                      value={fittingId}
                      onChange={setFittingId}
                    />
                    <StudioFittingHint />
                  </>
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
                    <div className="space-y-3 text-[15px]">
                      {(
                        [
                          ["Shape", shape?.name, 0],
                          ["Fabric", fabric?.name, 1],
                          ["Size", size?.name, 2],
                          ["Lining", lining?.name, 3],
                          ["Fitting", fitting?.name, 4],
                        ] as const
                      ).map(([k, v, jump]) => (
                        <button
                          key={k}
                          type="button"
                          className="flex w-full justify-between gap-4 border-b border-line/80 pb-2 text-left hover:text-bronze transition-colors"
                          onClick={() => setStep(jump)}
                        >
                          <span className="text-muted text-xs tracking-[0.12em] uppercase">
                            {k}
                          </span>
                          <span className="text-right font-medium">{v}</span>
                        </button>
                      ))}
                      <div className="flex justify-between gap-4 pt-2 font-medium text-lg">
                        <span>Total</span>
                        <span>{formatMoney(unitPrice)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button type="button" className="btn-primary" onClick={addToBag}>
                        Add to bag
                      </button>
                      <button type="button" className="btn-secondary" onClick={shareOrCopy}>
                        {copied ? "Link copied" : "Share / copy link"}
                      </button>
                      {authStatus === "authenticated" ? (
                        <button
                          type="button"
                          className="btn-quiet"
                          onClick={saveDesign}
                          disabled={saveBusy}
                        >
                          {saveBusy ? "Saving…" : saved ? "Saved" : "Save design"}
                        </button>
                      ) : (
                        <Link href={loginHref} className="btn-quiet">
                          Sign in to save
                        </Link>
                      )}
                      <Link
                        href={`/shop/lampshades?q=${encodeURIComponent(fabric?.name?.split(" ").slice(0, 3).join(" ") || "")}`}
                        className="btn-quiet"
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
                    </div>
                    {shareNote && (
                      <p className="text-xs text-muted break-all">
                        Copy this link:{" "}
                        <span className="text-ink">{shareNote}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted leading-relaxed">
                      Share the link to reopen this exact configuration. Made to order in Britain —
                      pay securely with Stripe.
                    </p>
                    {saved && (
                      <p className="text-sm text-bronze">
                        Design saved.{" "}
                        <Link
                          href="/account/saved-designs"
                          className="underline underline-offset-4"
                        >
                          View saved designs
                        </Link>
                      </p>
                    )}
                    {saveError && <p className="text-sm text-muted">{saveError}</p>}
                  </div>
                )}

                <div className="studio-inline-nav flex justify-between mt-10 pt-6 border-t border-line">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                  >
                    Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!canContinue}
                      onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                    >
                      Continue
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={addToBag}>
                      Add to bag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {!loadError && (
        <div className="studio-sticky" aria-label="Studio controls">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted truncate">
              {STEPS[step]} · {step + 1}/{STEPS.length}
            </p>
            <p className="font-medium mt-0.5">{formatMoney(unitPrice)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="btn-secondary !py-2 !px-3 text-sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn-primary !py-2 !px-3 text-sm"
                disabled={!canContinue}
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary !py-2 !px-3 text-sm"
                onClick={addToBag}
              >
                Add
              </button>
            )}
          </div>
        </div>
      )}
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
                <MediaImage
                  src={o.image}
                  alt=""
                  fill
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
