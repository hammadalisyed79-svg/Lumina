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
  fabricTextureUrl,
  getValidFabrics,
  getValidFittings,
  getValidLinings,
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
import { ShapeSilhouette } from "@/components/configurator/ShapeSilhouette";
import { FittingGlyph } from "@/components/configurator/FittingGlyph";
import { sizeMeasurement } from "@/lib/configurator/size-label";

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
    <div className="bg-paper studio-page cfg-page">
      <div className="container-site py-8 md:py-12 studio-page-body">
        <div className="studio-layout">
          <div className="studio-preview-col">
            <div className="cfg-skel aspect-[5/6] w-full" />
          </div>
          <div className="studio-options-col space-y-4">
            <div className="cfg-skel h-3 w-32 mb-2" />
            <div className="cfg-skel h-9 w-64 mb-3" />
            <div className="cfg-skel h-4 w-full max-w-sm mb-6" />
            <div className="cfg-skel h-8 w-full mb-4" />
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
  const [bagError, setBagError] = useState<string | null>(null);
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

  // Deep-link / saved design: scroll options column to the active step once ready
  useEffect(() => {
    if (!ready || !selection.step) return;
    const t = window.setTimeout(() => {
      sectionRefs.current[selection.step]?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [ready, selection.step]);

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
      topDiameterCm: size?.topDiameterCm,
      bottomDiameterCm: size?.bottomDiameterCm ?? size?.diameterCm,
    }),
    [size]
  );

  const textureUrl = fabricTextureUrl(fabric);

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
    const editCart = searchParams.get("editCart") || undefined;
    const config = {
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
    };

    void (async () => {
      let snapshot = undefined;
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: [
              {
                kind: "configured",
                quantity: selection.quantity,
                config: {
                  shapeKey: config.shapeKey,
                  sizeSlug: config.sizeSlug,
                  fabricSlug: config.fabricSlug,
                  liningSlug: config.liningSlug,
                  fittingSlug: config.fittingSlug,
                  useType: config.useType,
                  personalisation: config.personalisation,
                },
              },
            ],
          }),
        });
        const data = await res.json();
        const line = data.lines?.[0];
        if (!line?.ok) {
          const msg =
            line?.blocks?.map((b: { message: string }) => b.message).join(" ") ||
            "This configuration cannot be ordered yet.";
          setBagError(msg);
          return;
        }
        snapshot = line.snapshot;
        config.unitPrice = line.unitPrice;
      } catch {
        setBagError("Could not verify configuration with the server. Try again.");
        return;
      }

      setBagError(null);
      addConfigured({
        title: `Custom ${shape.name} · ${fabric.name}`,
        imageUrl: textureUrl || fabric.swatchUrl || fabric.imageUrl || undefined,
        quantity: selection.quantity,
        config,
        snapshot,
        replaceLineId: editCart || undefined,
      });
      setDrawerOpen(true);
      trackConfigurator("design_completed", {});
      if (editCart) {
        router.replace("/cart");
      }
    })();
  }

  const shapesAvail = catalog ? getValidShapes(catalog, selection.useType) : [];
  const sizesAvail = catalog ? getValidSizes(catalog, selection.shapeKey) : [];
  const fabricsAvail = catalog ? getValidFabrics(catalog, selection.shapeKey) : [];
  const liningsAvail = catalog ? getValidLinings(catalog, selection.shapeKey) : [];
  const fittingsAvail = catalog
    ? getValidFittings(catalog, selection.useType, selection.shapeKey)
    : [];
  const availableSizes = sizesAvail.filter((s) => s.available).map((s) => s.option);
  const availableFabrics = fabricsAvail
    .filter((f) => f.available)
    .map((f) => f.option);

  const stepIndex = CONFIG_STEPS.findIndex((s) => s.id === selection.step);

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
      <div className="container-site py-6 md:py-10 studio-page-body">
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
                    fabricUrl={textureUrl}
                    fabricName={fabric?.name}
                    patternScale={fabric?.patternScale}
                    patternOffsetX={fabric?.patternOffsetX}
                    patternOffsetY={fabric?.patternOffsetY}
                    patternRotation={fabric?.patternRotation}
                    repeatMode={fabric?.repeatMode}
                    liningName={lining?.name}
                    liningColour={lining?.colour}
                    liningHex={lining?.rendererHex}
                    reflectivityHint={lining?.reflectivityHint}
                    mode={previewMode}
                    room={room}
                    showDimensions={showDims}
                    onModeChange={setPreviewMode}
                    onRoomChange={setRoom}
                    onShowDimensionsChange={setShowDims}
                    onZoomFabric={
                      textureUrl || fabric?.swatchUrl
                        ? () => setZoomFabric(true)
                        : undefined
                    }
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

              <div className="studio-options-col space-y-12 md:space-y-14">
                <header className="cfg-panel-intro">
                  <p className="eyebrow">{COPY.designPage.eyebrow}</p>
                  <h1>{COPY.designPage.title}</h1>
                  <p>{COPY.designPage.body}</p>
                </header>

                <nav aria-label="Configurator progress">
                  <div className="studio-step-chips">
                    {CONFIG_STEPS.map((s, i) => {
                      const done = i < stepIndex;
                      const active = s.id === selection.step;
                      const num = String(i + 1).padStart(2, "0");
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`studio-step-chip ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}
                          onClick={() => goStep(s.id)}
                          aria-current={active ? "step" : undefined}
                        >
                          <span className="cfg-step-num">{num}</span>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* USE */}
                <section
                  ref={(el) => {
                    sectionRefs.current.use = el;
                  }}
                  id="cfg-use"
                  aria-labelledby="cfg-use-title"
                >
                  <h2 id="cfg-use-title" className="cfg-section-title">
                    Where will your shade be used?
                  </h2>
                  <div className="cfg-section-rule" />
                  <div className="cfg-use-grid" role="radiogroup" aria-labelledby="cfg-use-title">
                    {USE_TYPES.map((u) => {
                      const selected = selection.useType === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`studio-option cfg-use-tile ${selected ? "is-selected" : ""}`}
                          onClick={() => {
                            updateSelection({ useType: u.id }, "useType");
                            trackConfigurator("use_selected", { useType: u.id });
                            afterSelect("use", "shape");
                          }}
                        >
                          <span className="cfg-use-label">{u.label}</span>
                          <span className="cfg-use-hint">{u.hint}</span>
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
                  <h2 id="cfg-shape-title" className="cfg-section-title">
                    Choose shape
                  </h2>
                  <div className="cfg-section-rule" />
                  <div
                    className="cfg-shape-grid"
                    role="radiogroup"
                    aria-labelledby="cfg-shape-title"
                  >
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
                          className={`studio-option cfg-shape-tile ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                          onClick={() => {
                            if (!available) return;
                            updateSelection({ shapeKey: option.key }, "shapeKey");
                            trackConfigurator("shape_selected", { shape: option.key });
                            afterSelect("shape", "size");
                          }}
                        >
                          <ShapeSilhouette shapeKey={option.key} />
                          <span className="cfg-shape-name">{option.name}</span>
                          {!available && (
                            <span className="block text-[11px] text-muted">{reason}</span>
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
                  <h2 id="cfg-size-title" className="cfg-section-title">
                    Choose size
                  </h2>
                  <div className="cfg-section-rule" />
                  {!selection.shapeKey ? (
                    <p className="prose-muted text-sm mt-2">Choose a shape first.</p>
                  ) : availableSizes.length === 0 ? (
                    <p className="prose-muted text-sm mt-2" role="alert">
                      No compatible sizes for this shape. Please choose another silhouette.
                    </p>
                  ) : (
                    <div
                      className="cfg-size-grid"
                      role="radiogroup"
                      aria-labelledby="cfg-size-title"
                    >
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
                            className={`studio-option cfg-size-tile ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                            onClick={() => {
                              if (!available) return;
                              updateSelection({ sizeId: option.id }, "sizeId");
                              trackConfigurator("size_selected", { size: option.slug });
                              afterSelect("size", "fabric");
                            }}
                          >
                            <span className="cfg-size-measure">{sizeMeasurement(option)}</span>
                            <span className="cfg-size-name">{option.name}</span>
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
                    fabrics={
                      selection.shapeKey ? availableFabrics : catalog.fabrics
                    }
                    value={selection.fabricId}
                    onChange={(id) => {
                      updateSelection({ fabricId: id }, "fabricId");
                      trackConfigurator("fabric_selected", { fabricId: id });
                      afterSelect("fabric", "lining");
                    }}
                    onViewFabric={setViewFabric}
                  />
                  {selection.shapeKey && availableFabrics.length === 0 && (
                    <p className="prose-muted text-sm mt-4" role="alert">
                      No fabrics are linked to this shape yet. An admin can attach
                      fabrics in the catalogue eligibility settings.
                    </p>
                  )}
                </section>

                {/* LINING */}
                <section
                  ref={(el) => {
                    sectionRefs.current.lining = el;
                  }}
                  id="cfg-lining"
                  aria-labelledby="cfg-lining-title"
                >
                  <h2 id="cfg-lining-title" className="cfg-section-title">
                    Choose lining
                  </h2>
                  <div className="cfg-section-rule" />
                  <p className="prose-muted text-sm mb-5">
                    The interior of the shade updates in the preview.
                  </p>
                  <div
                    className="cfg-lining-grid"
                    role="radiogroup"
                    aria-labelledby="cfg-lining-title"
                  >
                    {liningsAvail.map(({ option: l, available, reason }) => {
                      const selected = selection.liningId === l.id;
                      const hex = l.rendererHex || liningSwatchHex(l.name, l.colour);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={!available}
                          title={!available ? reason : undefined}
                          className={`studio-option cfg-lining-tile ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                          onClick={() => {
                            if (!available) return;
                            updateSelection({ liningId: l.id }, "liningId");
                            trackConfigurator("lining_selected", { lining: l.slug });
                            setPreviewMode("interior");
                            afterSelect("lining", "fitting");
                          }}
                        >
                          <span
                            className="cfg-lining-swatch"
                            style={{ background: hex }}
                            aria-hidden
                          />
                          <span className="cfg-lining-name">{l.name}</span>
                          {l.priceMod ? (
                            <span className="text-xs text-muted">+{formatMoney(l.priceMod)}</span>
                          ) : null}
                          {!available && (
                            <span className="text-[11px] text-muted">{reason}</span>
                          )}
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
                  <h2 id="cfg-fitting-title" className="cfg-section-title">
                    Choose fitting
                  </h2>
                  <div className="cfg-section-rule" />
                  {selection.useType && (
                    <p className="prose-muted text-sm mb-5">
                      Recommended for{" "}
                      {USE_TYPES.find((u) => u.id === selection.useType)?.label.toLowerCase()}.
                    </p>
                  )}
                  <div
                    className="cfg-fitting-grid"
                    role="radiogroup"
                    aria-labelledby="cfg-fitting-title"
                  >
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
                          className={`studio-option cfg-fitting-tile ${selected ? "is-selected" : ""} ${!available ? "is-disabled" : ""}`}
                          onClick={() => {
                            if (!available) return;
                            updateSelection({ fittingId: option.id }, "fittingId");
                            trackConfigurator("fitting_selected", { fitting: option.slug });
                            afterSelect("fitting", "review");
                          }}
                        >
                          <FittingGlyph name={option.name} slug={option.slug} />
                          <span>
                            <span className="cfg-fitting-name">{option.name}</span>
                            {option.description && (
                              <span className="cfg-fitting-desc">{option.description}</span>
                            )}
                            {!available && (
                              <span className="block text-[11px] text-muted mt-1">{reason}</span>
                            )}
                          </span>
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
                  <h2 id="cfg-review-title" className="cfg-section-title">
                    Review your shade
                  </h2>
                  <div className="cfg-section-rule" />

                  {!validation.valid ? (
                    <p className="prose-muted mt-2">{nextHint(validation.missing)}</p>
                  ) : (
                    <div className="mt-4 space-y-6">
                      <div className="cfg-review-card">
                        <dl>
                          <div>
                            <dt>Use</dt>
                            <dd>{USE_TYPES.find((u) => u.id === selection.useType)?.label}</dd>
                          </div>
                          <div>
                            <dt>Shape</dt>
                            <dd>{shape?.name}</dd>
                          </div>
                          <div>
                            <dt>Size</dt>
                            <dd>{size?.name}</dd>
                          </div>
                          <div>
                            <dt>Fabric</dt>
                            <dd>{fabric?.name}</dd>
                          </div>
                          <div>
                            <dt>Lining</dt>
                            <dd>{lining?.name}</dd>
                          </div>
                          <div>
                            <dt>Fitting</dt>
                            <dd>{fitting?.name}</dd>
                          </div>
                          <div>
                            <dt>Lead time</dt>
                            <dd>Handmade to order — typically 2–3 weeks</dd>
                          </div>
                          <div>
                            <dt>Price</dt>
                            <dd className="font-display text-2xl">
                              {price ? formatMoney(price.unitPrice) : "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>

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

                      <div className="cfg-review-actions">
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
                      {bagError && (
                        <p className="text-sm text-red-700" role="alert">
                          {bagError}
                        </p>
                      )}
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

            {/* Mobile sticky bar — compact; does not cover option taps */}
            <div className="studio-sticky cfg-sticky-bar" aria-label="Configuration status">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.12em] uppercase text-muted truncate">
                  {validation.valid
                    ? [shape?.name, size?.name, fabric?.name].filter(Boolean).join(" · ")
                    : nextHint(validation.missing) || "Configure your shade"}
                </p>
                <p className="font-display text-lg leading-none mt-0.5">
                  {price ? formatMoney(price.unitPrice) : "—"}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary text-sm shrink-0"
                disabled={!validation.valid && !validation.missing.length}
                onClick={() =>
                  validation.valid
                    ? addToBag()
                    : goStep((validation.missing[0] as ConfigStepId) || "use")
                }
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
        fabricUrl={textureUrl || fabric?.swatchUrl}
      />
    </div>
  );
}
