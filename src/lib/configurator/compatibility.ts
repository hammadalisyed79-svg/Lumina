import type {
  ConfigCatalog,
  ConfigSelection,
  ConfigWarnings,
  FabricOpt,
  FittingOpt,
  LiningOpt,
  OptionAvailability,
  ShapeOpt,
  SizeOpt,
  UseType,
} from "./types";

/** Shapes suited to each use type (data-driven defaults; all shapes OK if empty). */
const USE_SHAPE_KEYS: Record<UseType, string[] | null> = {
  table: ["drum", "empire", "coolie", "oval", "square"],
  floor: ["drum", "empire", "coolie", "oval", "rectangular", "square"],
  ceiling: ["drum", "empire", "oval", "rectangular", "square", "tiered", "coolie"],
};

/** Fitting slug → preferred use types when Fitting.useTypes / compatibility empty. */
const FITTING_USE_DEFAULTS: Record<string, UseType[]> = {
  "candle-clip": ["table"],
  spider: ["table", "floor", "ceiling"],
  "e27-uno": ["ceiling"],
  uno: ["ceiling"],
};

/** Explicit width/depth (no diameter) → rectangular silhouette. */
function sizeLooksRectangular(s: SizeOpt): boolean {
  if (s.widthCm != null && s.diameterCm == null) return true;
  const hay = `${s.slug} ${s.name}`.toLowerCase();
  if (/\b(rect|rectangular|square)\b/.test(hay) && s.diameterCm == null) return true;
  return false;
}

function sizeLooksRound(s: SizeOpt): boolean {
  return s.diameterCm != null;
}

/** Whether a size geometrically suits a shape key. */
export function sizeCompatibleWithShape(size: SizeOpt, shapeKey: string | null): boolean {
  if (!shapeKey) return true;
  if (size.shapeKey && size.shapeKey !== shapeKey) return false;
  // Unscoped sizes: heuristic by dimension kind
  if (!size.shapeKey) {
    const rectShapes = new Set(["rectangular", "square"]);
    if (rectShapes.has(shapeKey)) {
      // Prefer width-based; still allow diameter sizes as fallback pool
      return true;
    }
    if (sizeLooksRectangular(size) && !sizeLooksRound(size)) {
      // Width-only / rect-named sizes not for round silhouettes
      return false;
    }
  }
  return true;
}

export function parseFittingUseTypes(fitting: {
  slug: string;
  compatibility?: string | null;
  useTypes?: UseType[];
}): UseType[] {
  if (fitting.useTypes && fitting.useTypes.length) return fitting.useTypes;
  const hay = `${fitting.slug} ${fitting.compatibility || ""}`.toLowerCase();
  const found: UseType[] = [];
  if (/ceiling|pendant|uno|hanging/.test(hay)) found.push("ceiling");
  if (/table|clip|candle|harp/.test(hay)) found.push("table");
  if (/floor/.test(hay)) found.push("floor");
  if (found.length) return [...new Set(found)];
  return FITTING_USE_DEFAULTS[fitting.slug] || [];
}

export function getValidShapes(
  catalog: ConfigCatalog,
  useType: UseType | null
): OptionAvailability<ShapeOpt>[] {
  const allowed = useType ? USE_SHAPE_KEYS[useType] : null;
  return catalog.shapes.map((option) => {
    if (!allowed || allowed.includes(option.key)) {
      return { option, available: true };
    }
    return {
      option,
      available: false,
      reason: `Less suited to ${useType} lamps — pick another shape or change use.`,
    };
  });
}

export function getValidSizes(
  catalog: ConfigCatalog,
  shapeKey: string | null
): OptionAvailability<SizeOpt>[] {
  return catalog.sizes.map((option) => {
    const ok = sizeCompatibleWithShape(option, shapeKey);
    return {
      option,
      available: ok,
      reason: ok
        ? undefined
        : `Not available for this ${shapeKey || "shape"} silhouette.`,
    };
  });
}

export function getValidFabrics(
  catalog: ConfigCatalog
): OptionAvailability<FabricOpt>[] {
  // No fabric↔shape restrictions in DB yet — all active fabrics available
  return catalog.fabrics.map((option) => ({ option, available: true }));
}

export function getValidLinings(
  catalog: ConfigCatalog
): OptionAvailability<LiningOpt>[] {
  return catalog.linings.map((option) => ({ option, available: true }));
}

export function getValidFittings(
  catalog: ConfigCatalog,
  useType: UseType | null
): OptionAvailability<FittingOpt>[] {
  return catalog.fittings.map((option) => {
    const uses = parseFittingUseTypes(option);
    if (!useType || uses.length === 0 || uses.includes(useType)) {
      return { option, available: true };
    }
    return {
      option,
      available: false,
      reason: `Unavailable for ${useType} — try another fitting.`,
    };
  });
}

export type InvalidationResult = {
  selection: ConfigSelection;
  warnings: ConfigWarnings;
};

/**
 * After an upstream change, clear only genuinely incompatible downstream choices.
 * Never silently substitute another option.
 */
export function invalidateAfterChange(
  catalog: ConfigCatalog,
  selection: ConfigSelection,
  changed: keyof ConfigSelection
): InvalidationResult {
  const next = { ...selection };
  const warnings: ConfigWarnings = [];

  if (changed === "useType" || changed === "shapeKey") {
    const sizes = getValidSizes(catalog, next.shapeKey);
    const sizeOk = sizes.find((s) => s.option.id === next.sizeId);
    if (next.sizeId && sizeOk && !sizeOk.available) {
      const shapeName =
        catalog.shapes.find((s) => s.key === next.shapeKey)?.name || "this shape";
      warnings.push(
        `Your previous size is not available for ${shapeName}. Please choose another size.`
      );
      next.sizeId = null;
      if (next.step !== "review" && next.step !== "use" && next.step !== "shape") {
        next.step = "size";
      }
    }

    const fittings = getValidFittings(catalog, next.useType);
    const fitOk = fittings.find((f) => f.option.id === next.fittingId);
    if (next.fittingId && fitOk && !fitOk.available) {
      warnings.push(
        "Your previous fitting is not available for this use. Please choose another fitting."
      );
      next.fittingId = null;
    }

    const shapes = getValidShapes(catalog, next.useType);
    const shapeOk = shapes.find((s) => s.option.key === next.shapeKey);
    if (next.shapeKey && shapeOk && !shapeOk.available) {
      warnings.push(
        "Your previous shape is less suited to this use. Please confirm or choose another shape."
      );
      // Do not clear automatically — available:false but still selected until user changes
    }
  }

  return { selection: next, warnings };
}

export function validateConfiguration(
  catalog: ConfigCatalog,
  selection: ConfigSelection
): { valid: boolean; missing: string[]; warnings: ConfigWarnings } {
  const missing: string[] = [];
  if (!selection.useType) missing.push("use");
  if (!selection.shapeKey) missing.push("shape");
  if (!selection.sizeId) missing.push("size");
  if (!selection.fabricId) missing.push("fabric");
  if (!selection.liningId) missing.push("lining");
  if (!selection.fittingId) missing.push("fitting");

  const warnings: ConfigWarnings = [];
  const size = catalog.sizes.find((s) => s.id === selection.sizeId);
  if (size && !sizeCompatibleWithShape(size, selection.shapeKey)) {
    warnings.push("Selected size is not compatible with the current shape.");
  }
  const fitting = catalog.fittings.find((f) => f.id === selection.fittingId);
  if (fitting && selection.useType) {
    const uses = parseFittingUseTypes(fitting);
    if (uses.length && !uses.includes(selection.useType)) {
      warnings.push("Selected fitting is not compatible with the current use.");
    }
  }

  return {
    valid: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
  };
}

/** Size guidance for table/floor bases — advisory only. */
export function recommendSizeRange(
  useType: UseType | null,
  baseWidthCm?: number | null,
  baseHeightCm?: number | null
): { minCm: number; maxCm: number; note: string } | null {
  if (useType === "ceiling") {
    return {
      minCm: 30,
      maxCm: 50,
      note: "For most pendants, 30–50 cm diameter balances the room without crowding.",
    };
  }
  if (baseWidthCm != null && Number.isFinite(baseWidthCm) && baseWidthCm > 0) {
    const mid = Math.round(baseWidthCm * 0.66);
    return {
      minCm: Math.max(20, mid - 5),
      maxCm: mid + 5,
      note: `About two-thirds of your base width (~${mid} cm) is a classic starting point.`,
    };
  }
  if (useType === "floor") {
    return {
      minCm: 40,
      maxCm: 50,
      note: "Floor lamps often suit 40–50 cm shades for visual weight.",
    };
  }
  if (useType === "table") {
    return {
      minCm: 30,
      maxCm: 40,
      note: "Table lamps often suit 30–40 cm shades — adjust to your base.",
    };
  }
  void baseHeightCm;
  return null;
}
