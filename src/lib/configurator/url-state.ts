import type {
  ConfigCatalog,
  ConfigSelection,
  ConfigStepId,
  UseType,
} from "./types";
import { USE_TYPES } from "./types";
import { sizeCompatibleWithShape, parseFittingUseTypes } from "./compatibility";

const USE_IDS = new Set(USE_TYPES.map((u) => u.id));

export function emptySelection(step: ConfigStepId = "use"): ConfigSelection {
  return {
    useType: null,
    shapeKey: null,
    sizeId: null,
    fabricId: null,
    liningId: null,
    fittingId: null,
    personalisation: "",
    quantity: 1,
    step,
  };
}

/** Validate URL / saved-design params against catalog; ignore invalid IDs. */
export function parseConfigFromParams(
  catalog: ConfigCatalog,
  params: URLSearchParams | Record<string, string | null | undefined>
): Partial<ConfigSelection> {
  const get = (k: string) =>
    params instanceof URLSearchParams
      ? params.get(k)
      : (params as Record<string, string | null | undefined>)[k] ?? null;

  const out: Partial<ConfigSelection> = {};

  const use = get("use") || get("useType");
  if (use && USE_IDS.has(use as UseType)) {
    out.useType = use as UseType;
  }

  const shape = get("shape");
  if (shape && catalog.shapes.some((s) => s.key === shape)) {
    out.shapeKey = shape;
  }

  const fabric = get("fabric");
  if (fabric) {
    const f = catalog.fabrics.find((x) => x.slug === fabric || x.id === fabric);
    if (f) out.fabricId = f.id;
  }

  const size = get("size");
  if (size) {
    const s = catalog.sizes.find((x) => x.slug === size || x.id === size);
    if (s && sizeCompatibleWithShape(s, out.shapeKey ?? null)) {
      out.sizeId = s.id;
    }
  }

  const lining = get("lining");
  if (lining) {
    const l = catalog.linings.find((x) => x.slug === lining || x.id === lining);
    if (l) out.liningId = l.id;
  }

  const fitting = get("fitting");
  if (fitting) {
    const f = catalog.fittings.find((x) => x.slug === fitting || x.id === fitting);
    if (f) {
      const uses = parseFittingUseTypes(f);
      if (!out.useType || !uses.length || uses.includes(out.useType)) {
        out.fittingId = f.id;
      }
    }
  }

  const qty = Number(get("qty") || get("quantity") || "");
  if (Number.isFinite(qty) && qty >= 1 && qty <= 20) out.quantity = Math.floor(qty);

  const note = get("note") || get("personalisation");
  if (note && note.length <= 200) out.personalisation = note;

  const step = get("step");
  const stepMap: Record<string, ConfigStepId> = {
    use: "use",
    "0": "use",
    shape: "shape",
    "1": "shape",
    size: "size",
    "2": "size",
    fabric: "fabric",
    "3": "fabric",
    lining: "lining",
    "4": "lining",
    fitting: "fitting",
    "5": "fitting",
    review: "review",
    "6": "review",
  };
  if (step && stepMap[step]) out.step = stepMap[step];

  return out;
}

export function buildSharePath(selection: ConfigSelection, catalog: ConfigCatalog): string {
  const p = new URLSearchParams();
  if (selection.useType) p.set("use", selection.useType);
  if (selection.shapeKey) p.set("shape", selection.shapeKey);
  const fabric = catalog.fabrics.find((f) => f.id === selection.fabricId);
  const size = catalog.sizes.find((s) => s.id === selection.sizeId);
  const lining = catalog.linings.find((l) => l.id === selection.liningId);
  const fitting = catalog.fittings.find((f) => f.id === selection.fittingId);
  if (fabric) p.set("fabric", fabric.slug);
  if (size) p.set("size", size.slug);
  if (lining) p.set("lining", lining.slug);
  if (fitting) p.set("fitting", fitting.slug);
  if (selection.quantity > 1) p.set("qty", String(selection.quantity));
  if (selection.step && selection.step !== "use") p.set("step", selection.step);
  const q = p.toString();
  return q ? `/design-your-shade?${q}` : "/design-your-shade";
}

export function buildDesignSharePath(designId: string): string {
  return `/design-your-shade?design=${encodeURIComponent(designId)}`;
}
