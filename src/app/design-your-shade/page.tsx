"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";
import { COPY } from "@/lib/copy";
import { liningSwatchHex } from "@/lib/studio/images";
import {
  CONFIG_STEPS,
  USE_TYPES,
  type ConfigCatalog,
  type ConfigSelection,
  type ConfigStepId,
  type FabricOpt,
  type PreviewMode,
  type RoomContext,
  type UseType,
} from "@/lib/configurator/types";
import {
  getValidFittings,
  getValidShapes,
  getValidSizes,
  invalidateAfterChange,
  validateConfiguration,
} from "@/lib/configurator/compatibility";
import { calculateShadePrice } from "@/lib/configurator/pricing";
import { trackConfigurator } from "@/lib/configurator/analytics";
import {
  buildDesignSharePath,
  buildSharePath,
  emptySelection,
  parseConfigFromParams,
} from "@/lib/configurator/url-state";
import { ConfiguratorPreview } from "@/components/configurator/ConfiguratorPreview";
import { FabricBrowser } from "@/components/configurator/FabricBrowser";
import { SpecSummary } from "@/components/configurator/SpecSummary";
import { SizeAssist } from "@/components/configurator/SizeAssist";
import { FabricLightbox } from "@/components/configurator/FabricLightbox";

const GUEST_KEY = "luminahub_studio_guest";
const LOCAL_SAVE = "luminahub_studio_draft_v2";
const STUDIO_BRIEF = "luminahub_studio_enquiry_brief";

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

function nextHint(missing: string[]): string | null {
  const map: Record<string, string> = {
    use: "Choose where the shade will be used to continue",
    shape: "Choose a shape to continue",
    size: "Choose a size to continue",
    fabric: "Choose a fabric to continue",
    lining: "Choose a lining to continue",
    fitting: "Choose a fitting to continue",
  };
  return missing[0] ? map[missing[0]] || null : null;
}

function SkeletonFallback() {
  return (
    <div className="bg-paper studio-page">
      <div className="border-b border-line bg-ivory/70">
        <div className="container-site py-10 md:py-14 max-w-3xl">
          <div className="cfg-skel h-3 w-24 mb-4" />
          <div className="cfg-skel h-10 w-72 mb-3" />
          <div className="cfg-skel h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="container-site py-10 md:py-14">
        <div className="studio-layout">
          <div className="studio-preview-col">
            <div className="cfg-skel aspect-[5/6] w-full" />
          </div>
          <div className="studio-options-col space-y-4">
            <div className="cfg-skel h-8 w-48" />
            <div className="grid grid-cols-2 gap-3">
              <div className="cfg-skel h-24" />
              <div className="cfg-skel h-24" />
              <div className="cfg-skel h-24" />
              <div className="cfg-skel h-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignYourShadePage() {
  return (
    <Suspense fallback={<SkeletonFallback />}>
      <DesignStudioInner />
    </Suspense>
  );
}

function DesignStudioInner() {
  const { addConfigured, setDrawerOpen } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [catalog, setCatalog] = useState<ConfigCatalog | null>(null);
  const [selection, setSelection] = useState<ConfigSelection>(emptySelection());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("exterior");
  const [room, setRoom] = useState<RoomContext>("studio");
  const [showDims, setShowDims] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [viewFabric, setViewFabric] = useState<FabricOpt | null>(null);
  const [zoomFabric, setZoomFabric] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const startedRef = useRef(false);
  const sectionRefs = useRef<Partial<Record<ConfigStepId, HTMLElement | null>>>({});

  const loadCatalog = useCallback(async () => {
    setLoadError(false);
    setReady(false);
    try {
      const res = await fetch("/api/config-options");
      if (!res.ok) throw new Error("bad");
      const d = await res.json();
      const nextCatalog: ConfigCatalog = {
        shapes: d.shapes || [],
        sizes: d.sizes || [],
        fabrics: d.fabrics || [],
        linings: d.linings || [],
        fittings: d.fittings || [],
      };
      setCatalog(nextCatalog);

      let next = emptySelection();

      const designId = searchParams.get("design");
      if (designId) {
        try {
          const dr = await fetch(`/api/saved-designs?id=${encodeURIComponent(designId)}`);
          if (dr.ok) {
            const design = await dr.json();
            const sel = design.selection || {};
            next = {
              ...next,
              useType: (sel.useType as UseType) || null,
              shapeKey: sel.shapeKey || null,
              sizeId: sel.sizeId || null,
              fabricId: sel.fabricId || null,
              liningId: sel.liningId || null,
              fittingId: sel.fittingId || null,
              personalisation: sel.personalisation || "",
              quantity: sel.quantity || 1,
              step: "review",
            };
            setSavedId(design.id);
            if (design.inactive?.length) {
              setWarnings([
                `Some options are no longer available (${design.inactive.join(", ")}). Please review your choices.`,
              ]);
            }
          } else {
            setWarnings(["That shared design could not be found. Start a new configuration."]);
          }
        } catch {
          setWarnings(["Could not load the shared design."]);
        }
      } else {
        const fromUrl = parseConfigFromParams(nextCatalog, searchParams);
        next = { ...next, ...fromUrl };

        // Guest local draft if URL empty
        if (!fromUrl.shapeKey && !fromUrl.fabricId) {
          try {
            const raw = localStorage.getItem(LOCAL_SAVE);
            if (raw) {
              const draft = JSON.parse(raw) as Partial<ConfigSelection>;
              const validated = parseConfigFromParams(nextCatalog, {
                use: draft.useType,
                shape: draft.shapeKey,
                fabric: draft.fabricId,
                size: draft.sizeId,
                lining: draft.liningId,
                fitting: draft.fittingId,
              });
              next = { ...next, ...validated, personalisation: draft.personalisation || "", quantity: draft.quantity || 1 };
            }
          } catch {
            /* ignore */
          }
        }
      }

      // Validate inactive / missing after merge
      if (next.fabricId && !nextCatalog.fabrics.some((f) => f.id === next.fabricId)) {
        next.fabricId = null;
        setWarnings((w) => [...w, "A previously selected fabric is no longer available."]);
      }

      setSelection(next);
      setReady(true);
      if (!startedRef.current) {
        startedRef.current = true;
        trackConfigurator("started", {});
      }
    } catch {
      setLoadError(true);
      setReady(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shape = catalog?.shapes.find((s) => s.key === selection.shapeKey);
  const size = catalog?.sizes.find((s) => s.id === selection.sizeId);
  const fabric = catalog?.fabrics.find((f) => f.id === selection.fabricId);
  const lining = catalog?.linings.find((l) => l.id === selection.liningId);
  const fitting = catalog?.fittings.find((f) => f.id === selection.fittingId);

  const price = useMemo(() => {
    if (!catalog || !selection.shapeKey) return null;
    return calculateShadePrice(catalog, selection);
  }, [catalog, selection]);

  const validation = useMemo(() => {
    if (!catalog) return { valid: false, missing: ["use"], warnings: [] as string[] };
    return validateConfiguration(catalog, selection);
  }, [catalog, selection]);

  const dims = useMemo(
    () => ({
      diameterCm: size?.diameterCm,
      heightCm: size?.heightCm,
      widthCm: size?.widthCm,
      depthCm: size?.depthCm,
      bottomDiameterCm: size?.diameterCm,
    }),
    [size]
  );

  // Sync room context with use type when entering room mode
  useEffect(() => {
    if (selection.useType === "ceiling") setRoom("ceiling");
    else if (selection.useType === "floor") setRoom("floor");
    else if (selection.useType === "table") setRoom("table");
  }, [selection.useType]);

  // Persist guest draft
  useEffect(() => {
    if (!ready || !catalog) return;
    try {
      localStorage.setItem(LOCAL_SAVE, JSON.stringify(selection));
    } catch {
      /* ignore */
    }
  }, [selection, ready, catalog]);

  // URL sync
  useEffect(() => {
    if (!ready || !catalog || loadError) return;
    if (savedId && searchParams.get("design") === savedId) return;
    const t = setTimeout(() => {
      const path = buildSharePath(selection, catalog);
      router.replace(path, { scroll: false });
    }, 150);
    return () => clearTimeout(t);
  }, [selection, ready, catalog, loadError, router, savedId, searchParams]);

  const updateSelection = useCallback(
    (
      patch: Partial<ConfigSelection>,
      changed?: keyof ConfigSelection
    ) => {
      if (!catalog) return;
      setSelection((prev) => {
        let next = { ...prev, ...patch };
        if (changed) {
          const inv = invalidateAfterChange(catalog, next, changed);
          next = inv.selection;
          if (inv.warnings.length) {
            setWarnings(inv.warnings);
          } else {
            setWarnings([]);
          }
        }
        return next;
      });
    },
    [catalog]
  );

  const goStep = useCallback((step: ConfigStepId) => {
    setSelection((prev) => ({ ...prev, step }));
    requestAnimationFrame(() => {
      sectionRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const afterSelect = useCallback(
    (current: ConfigStepId, next: ConfigStepId) => {
      setSelection((prev) => ({ ...prev, step: next }));
      requestAnimationFrame(() => {
        sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      void current;
    },
    []
  );

  async function saveDesign() {
    if (!catalog || !shape || !fabric || !size || !lining || !fitting || !price) return;
    setSaveBusy(true);
    setSaveError(null);
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
          unitPrice: price.unitPrice,
          useType: selection.useType || undefined,
          personalisation: selection.personalisation || undefined,
          quantity: selection.quantity,
          guestKey: session?.user ? undefined : guestKey() || undefined,
        }),
      });
      if (!res.ok) {
        setSaveError("Could not save this design. Try again.");
        return;
      }
      const data = await res.json();
      setSavedId(data.id);
      trackConfigurator("design_saved", { id: data.id });
      const path = buildDesignSharePath(data.id);
      router.replace(path, { scroll: false });
    } catch {
      setSaveError("Could not save this design. Try again.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function shareOrCopy() {
    if (!catalog) return;
    const path = savedId
      ? buildDesignSharePath(savedId)
      : buildSharePath({ ...selection, step: "review" }, catalog);
    const url = `${window.location.origin}${path}`;
    setShareNote(null);
    trackConfigurator("design_shared", { savedId });
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
        /* clipboard */
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

  function askStudio() {
    trackConfigurator("studio_enquiry_started", {});
    const lines = [
      "Ask the Studio about this design:",
      selection.useType ? `Use: ${selection.useType}` : null,
      shape ? `Shape: ${shape.name}` : null,
      size ? `Size: ${size.name}` : null,
      fabric ? `Fabric: ${fabric.name}` : null,
      lining ? `Lining: ${lining.name}` : null,
      fitting ? `Fitting: ${fitting.name}` : null,
      price ? `Price shown: ${formatMoney(price.unitPrice)}` : null,
      savedId ? `Design ID: ${savedId}` : null,
      selection.personalisation ? `Note: ${selection.personalisation}` : null,
    ].filter(Boolean);
    try {
      sessionStorage.setItem(STUDIO_BRIEF, lines.join("\n"));
    } catch {
      /* ignore */
    }
    router.push("/contact?from=studio");
  }

  function addToBag() {
    if (!shape || !fabric || !size || !lining || !fitting || !price || !validation.valid) return;
    addConfigured({
      title: `Custom ${shape.name} · ${fabric.name}`,
      imageUrl: fabric.imageUrl || fabric.swatchUrl || undefined,
      quantity: selection.quantity,
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
        unitPrice: price.unitPrice,
        useType: selection.useType,
        personalisation: selection.personalisation || undefined,
      },
    });
    setDrawerOpen(true);
    trackConfigurator("design_completed", {});
  }

  const shapesAvail = catalog ? getValidShapes(catalog, selection.useType) : [];
  const sizesAvail = catalog ? getValidSizes(catalog, selection.shapeKey) : [];
  const fittingsAvail = catalog ? getValidFittings(catalog, selection.useType) : [];
  const availableSizes = sizesAvail.filter((s) => s.available).map((s) => s.option);

  const stepIndex = CONFIG_STEPS.findIndex((s) => s.id === selection.step);
  const progress = ((Math.max(0, stepIndex) + 1) / CONFIG_STEPS.length) * 100;

  const loginHref = `/account/login?callbackUrl=${encodeURIComponent(
    savedId
      ? buildDesignSharePath(savedId)
      : catalog
        ? buildSharePath(selection, catalog)
        : "/design-your-shade"
  )}`;

  if (!ready) return <SkeletonFallback />;

  return (
    <div className="bg-paper studio-page cfg-page">
      <div className="border-b border-line bg-ivory/70">
        <div className="container-site py-10 md:py-14 max-w-3xl">
          <p className="eyebrow mb-3">{COPY.designPage.eyebrow}</p>
          <h1 className="section-title mb-3">{COPY.designPage.title}</h1>
          <div className="lux-rule" />
          <p className="prose-muted">
            Configure use, silhouette, size, fabric, lining and fitting. The live preview
            updates with every choice.
          </p>
        </div>
      </div>

      <div className="container-site py-8 md:py-12 studio-page-body">
        {loadError || !catalog ? (
          <div className="surface-panel p-8 max-w-lg mx-auto text-center space-y-4">
            <p className="eyebrow">Studio</p>
            <h2 className="font-display text-3xl tracking-tight">Options unavailable</h2>
            <p className="prose-muted text-sm">
              We could not load shapes and fabrics. Check your connection and try again.
            </p>
            <button type="button" className="btn-primary" onClick={loadCatalog}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <nav className="mb-6 md:mb-8" aria-label="Configurator progress">
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-xs tracking-[0.16em] uppercase text-muted">
                  Step {stepIndex + 1} of {CONFIG_STEPS.length}
                </p>
              </div>
              <div className="h-px bg-line overflow-hidden mb-4">
                <div
                  className="h-full bg-bronze transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="studio-step-chips">
                {CONFIG_STEPS.map((s, i) => {
                  const done = i < stepIndex;
                  const active = s.id === selection.step;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`studio-step-chip ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}
                      onClick={() => goStep(s.id)}
                      aria-current={active ? "step" : undefined}
                    >
                      {i + 1} {s.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {warnings.map((w) => (
              <div
                key={w}
                className="mb-4 border border-bronze/40 bg-ivory px-4 py-3 text-sm"
                role="status"
              >
                {w}
              </div>
            ))}

            <div className="studio-layout">
              <div className="studio-preview-col">
                <div className="cfg-preview-sticky">
                  <ConfiguratorPreview
                    shapeKey={selection.shapeKey || "drum"}
                    dims={dims}
                    fabricUrl={fabric?.imageUrl || fabric?.swatchUrl}
                    fabricName={fabric?.name}
                    patternScale={fabric?.patternScale}
                    liningName={lining?.name}
                    liningColour={lining?.colour}
                    mode={previewMode}
                    room={room}
                    showDimensions={showDims}
                    onModeChange={setPreviewMode}
                    onRoomChange={setRoom}
                    onShowDimensionsChange={setShowDims}
                    onZoomFabric={() => setZoomFabric(true)}
                  />
                </div>
                <div className="mt-6 hidden lg:block">
                  <SpecSummary
                    catalog={catalog}
                    selection={selection}
                    price={price}
                    nextHint={nextHint(validation.missing)}
                    showPriceDetails={showPriceDetails}
                    onTogglePriceDetails={() => setShowPriceDetails((v) => !v)}
                  />
                </div>
              </div>

              <div className="studio-options-col space-y-14 md:space-y-16">
                {/* USE */}
                <section
                  ref={(el) => {
                    sectionRefs.current.use = el;
                  }}
                  id="cfg-use"
                  aria-labelledby="cfg-use-title"
                >
                  <h2 id="cfg-use-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Where will your shade be used?
                  </h2>
                  <div className="lux-rule" />
                  <div className="grid gap-3 mt-6" role="radiogroup" aria-labelledby="cfg-use-title">
                    {USE_TYPES.map((u) => {
                      const selected = selection.useType === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`studio-option ${selected ? "is-selected" : ""}`}
                          onClick={() => {
                            updateSelection({ useType: u.id }, "useType");
                            trackConfigurator("use_selected", { useType: u.id });
                            afterSelect("use", "shape");
                          }}
                        >
                          <span className="font-medium block">{u.label}</span>
                          <span className="text-sm text-muted">{u.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SHAPE */}
                <section
                  ref={(el) => {
                    sectionRefs.current.shape = el;
                  }}
                  id="cfg-shape"
                  aria-labelledby="cfg-shape-title"
                >
                  <h2 id="cfg-shape-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Choose shape
                  </h2>
                  <div className="lux-rule" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6" role="radiogroup" aria-labelledby="cfg-shape-title">
                    {shapesAvail.map(({ option, available, reason }) => {
                      const selected = selection.shapeKey === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-disabled={!available}
                          disabled={!available}
                          title={!available ? reason : undefined}
                          className={`studio-option ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                          onClick={() => {
                            if (!available) return;
                            updateSelection({ shapeKey: option.key }, "shapeKey");
                            trackConfigurator("shape_selected", { shape: option.key });
                            afterSelect("shape", "size");
                          }}
                        >
                          <span className="font-medium">{option.name}</span>
                          {!available && (
                            <span className="block text-[11px] text-muted mt-1">{reason}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SIZE */}
                <section
                  ref={(el) => {
                    sectionRefs.current.size = el;
                  }}
                  id="cfg-size"
                  aria-labelledby="cfg-size-title"
                >
                  <h2 id="cfg-size-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Choose size
                  </h2>
                  <div className="lux-rule" />
                  {!selection.shapeKey ? (
                    <p className="prose-muted text-sm mt-4">Choose a shape first.</p>
                  ) : availableSizes.length === 0 ? (
                    <p className="prose-muted text-sm mt-4" role="alert">
                      No compatible sizes for this shape. Please choose another silhouette.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mt-6" role="radiogroup" aria-labelledby="cfg-size-title">
                      {sizesAvail.map(({ option, available, reason }) => {
                        const selected = selection.sizeId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            title={!available ? reason : undefined}
                            className={`studio-option ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                            onClick={() => {
                              if (!available) return;
                              updateSelection({ sizeId: option.id }, "sizeId");
                              trackConfigurator("size_selected", { size: option.slug });
                              afterSelect("size", "fabric");
                            }}
                          >
                            <span className="font-medium">{option.name}</span>
                            {option.priceMod ? (
                              <span className="block text-xs text-muted mt-1">
                                +{formatMoney(option.priceMod)}
                              </span>
                            ) : null}
                            {!available && (
                              <span className="block text-[11px] text-muted mt-1">{reason}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <SizeAssist useType={selection.useType} availableSizes={availableSizes} />
                </section>

                {/* FABRIC */}
                <section
                  ref={(el) => {
                    sectionRefs.current.fabric = el;
                  }}
                  id="cfg-fabric"
                >
                  <FabricBrowser
                    fabrics={catalog.fabrics}
                    value={selection.fabricId}
                    onChange={(id) => {
                      updateSelection({ fabricId: id }, "fabricId");
                      trackConfigurator("fabric_selected", { fabricId: id });
                      afterSelect("fabric", "lining");
                    }}
                    onViewFabric={setViewFabric}
                  />
                </section>

                {/* LINING */}
                <section
                  ref={(el) => {
                    sectionRefs.current.lining = el;
                  }}
                  id="cfg-lining"
                  aria-labelledby="cfg-lining-title"
                >
                  <h2 id="cfg-lining-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Choose lining
                  </h2>
                  <div className="lux-rule" />
                  <p className="prose-muted text-sm mb-5">
                    The interior of the shade updates in the preview.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-labelledby="cfg-lining-title">
                    {catalog.linings.map((l) => {
                      const selected = selection.liningId === l.id;
                      const hex = liningSwatchHex(l.name, l.colour);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`studio-option ${selected ? "is-selected" : ""}`}
                          onClick={() => {
                            updateSelection({ liningId: l.id }, "liningId");
                            trackConfigurator("lining_selected", { lining: l.slug });
                            setPreviewMode("interior");
                            afterSelect("lining", "fitting");
                          }}
                        >
                          <span
                            className="inline-block w-5 h-5 rounded-full border border-line mr-2 align-middle"
                            style={{ background: hex }}
                            aria-hidden
                          />
                          <span className="font-medium">{l.name}</span>
                          {l.priceMod ? (
                            <span className="block text-xs text-muted mt-1">
                              +{formatMoney(l.priceMod)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* FITTING */}
                <section
                  ref={(el) => {
                    sectionRefs.current.fitting = el;
                  }}
                  id="cfg-fitting"
                  aria-labelledby="cfg-fitting-title"
                >
                  <h2 id="cfg-fitting-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Choose fitting
                  </h2>
                  <div className="lux-rule" />
                  {selection.useType && (
                    <p className="prose-muted text-sm mb-5">
                      Recommended for{" "}
                      {USE_TYPES.find((u) => u.id === selection.useType)?.label.toLowerCase()}.
                    </p>
                  )}
                  <div className="grid gap-3" role="radiogroup" aria-labelledby="cfg-fitting-title">
                    {fittingsAvail.map(({ option, available, reason }) => {
                      const selected = selection.fittingId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={!available}
                          title={!available ? reason : undefined}
                          className={`studio-option ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                          onClick={() => {
                            if (!available) return;
                            updateSelection({ fittingId: option.id }, "fittingId");
                            trackConfigurator("fitting_selected", { fitting: option.slug });
                            afterSelect("fitting", "review");
                          }}
                        >
                          <span className="font-medium">{option.name}</span>
                          {option.description && (
                            <span className="block text-sm text-muted mt-1">{option.description}</span>
                          )}
                          {!available && (
                            <span className="block text-[11px] text-muted mt-1">{reason}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* REVIEW */}
                <section
                  ref={(el) => {
                    sectionRefs.current.review = el;
                  }}
                  id="cfg-review"
                  aria-labelledby="cfg-review-title"
                  className="pb-8"
                >
                  <h2 id="cfg-review-title" className="font-display text-3xl md:text-4xl tracking-tight mb-2">
                    Review your shade
                  </h2>
                  <div className="lux-rule" />

                  {!validation.valid ? (
                    <p className="prose-muted mt-4">{nextHint(validation.missing)}</p>
                  ) : (
                    <div className="mt-6 space-y-6">
                      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Use</dt>
                          <dd>{USE_TYPES.find((u) => u.id === selection.useType)?.label}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Shape</dt>
                          <dd>{shape?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Size</dt>
                          <dd>{size?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Fabric</dt>
                          <dd>{fabric?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Lining</dt>
                          <dd>{lining?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Fitting</dt>
                          <dd>{fitting?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Lead time</dt>
                          <dd>Handmade to order — typically 2–3 weeks</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-[11px] uppercase tracking-[0.1em]">Price</dt>
                          <dd className="font-display text-2xl">{price ? formatMoney(price.unitPrice) : "—"}</dd>
                        </div>
                      </dl>

                      <label className="block max-w-md">
                        <span className="label">Personalisation (optional)</span>
                        <textarea
                          className="input"
                          rows={2}
                          maxLength={200}
                          value={selection.personalisation}
                          onChange={(e) =>
                            updateSelection({ personalisation: e.target.value })
                          }
                          placeholder="Gift note or special request for the studio"
                        />
                      </label>

                      <label className="block max-w-[8rem]">
                        <span className="label">Quantity</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="input"
                          value={selection.quantity}
                          onChange={(e) =>
                            updateSelection({
                              quantity: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                            })
                          }
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={saveBusy}
                          onClick={saveDesign}
                        >
                          {saveBusy ? "Saving…" : savedId ? "Save again" : "Save design"}
                        </button>
                        <button type="button" className="btn-secondary" onClick={shareOrCopy}>
                          {copied ? "Link copied" : "Share design"}
                        </button>
                        <button type="button" className="btn-quiet" onClick={askStudio}>
                          Ask the Studio
                        </button>
                        <button type="button" className="btn-primary" onClick={addToBag}>
                          Add to bag
                        </button>
                      </div>

                      {!session?.user && (
                        <p className="text-sm prose-muted">
                          Guests can save temporarily.{" "}
                          <Link href={loginHref} className="underline underline-offset-4 hover:text-bronze">
                            Sign in
                          </Link>{" "}
                          to keep designs in your account.
                        </p>
                      )}
                      {saveError && <p className="text-sm text-red-700">{saveError}</p>}
                      {shareNote && (
                        <p className="text-sm break-all prose-muted">Share link: {shareNote}</p>
                      )}
                      {savedId && (
                        <p className="text-sm text-muted">
                          Saved — reopen anytime via{" "}
                          <Link
                            href={buildDesignSharePath(savedId)}
                            className="underline underline-offset-4"
                          >
                            this link
                          </Link>
                          .
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Mobile summary only while configuring — review already lists the full spec */}
                {!validation.valid && (
                  <div className="lg:hidden">
                    <SpecSummary
                      catalog={catalog}
                      selection={selection}
                      price={price}
                      nextHint={nextHint(validation.missing)}
                      showPriceDetails={showPriceDetails}
                      onTogglePriceDetails={() => setShowPriceDetails((v) => !v)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile sticky bar */}
            <div className="studio-sticky">
              <div>
                <p className="text-[11px] tracking-[0.12em] uppercase text-muted">Your shade</p>
                <p className="font-display text-xl leading-none">
                  {price ? formatMoney(price.unitPrice) : "—"}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={!validation.valid}
                onClick={() => (validation.valid ? addToBag() : goStep(validation.missing[0] as ConfigStepId || "use"))}
              >
                {validation.valid ? "Add to bag" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>

      <FabricLightbox
        fabric={viewFabric}
        onClose={() => {
          setViewFabric(null);
          setZoomFabric(false);
        }}
        zoomOnShade={zoomFabric}
        fabricUrl={fabric?.imageUrl || fabric?.swatchUrl}
      />
    </div>
  );
}
