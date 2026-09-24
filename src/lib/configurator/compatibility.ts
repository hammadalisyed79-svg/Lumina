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

/** Explicit Shape → Size via eligibleShapeKeys (from ShapeSize). */
export function sizeCompatibleWithShape(
  size: SizeOpt,
  shapeKey: string | null
): boolean {
  if (!shapeKey) return true;
  if (size.eligibleShapeKeys?.length) {
    return size.eligibleShapeKeys.includes(shapeKey);
  }
  // No eligibility rows yet — deny rather than guess
  return false;
}

export function parseFittingUseTypes(fitting: {
  slug: string;
  useTypes?: UseType[];
}): UseType[] {
  return fitting.useTypes?.length ? fitting.useTypes : [];
}

export function getValidShapes(
  catalog: ConfigCatalog,
  useType: UseType | null
): OptionAvailability<ShapeOpt>[] {
  return catalog.shapes.map((option) => {
    const uses = option.useTypes || [];
    if (!useType || !uses.length || uses.includes(useType)) {
      return { option, available: true };
    }
    return {
      option,
      available: false,
      reason: `Not available for ${useType} — pick another shape or change use.`,
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
        : shapeKey
          ? `Not available for this ${shapeKey} silhouette.`
          : "Choose a shape first.",
    };
  });
}

export function getValidFabrics(
  catalog: ConfigCatalog,
  shapeKey: string | null
): OptionAvailability<FabricOpt>[] {
  return catalog.fabrics.map((option) => {
    if (!shapeKey) return { option, available: true };
    const keys = option.eligibleShapeKeys || [];
    if (!keys.length) {
      return {
        option,
        available: false,
        reason: "Not linked to this shape in the catalogue.",
      };
    }
    const ok = keys.includes(shapeKey);
    return {
      option,
      available: ok,
      reason: ok ? undefined : "Unavailable with this shape.",
    };
  });
}

export function getValidLinings(
  catalog: ConfigCatalog,
  shapeKey: string | null
): OptionAvailability<LiningOpt>[] {
  return catalog.linings.map((option) => {
    if (!shapeKey) return { option, available: true };
    const keys = option.eligibleShapeKeys || [];
    if (!keys.length) {
      return {
        option,
        available: false,
        reason: "Not linked to this shape in the catalogue.",
      };
    }
    const ok = keys.includes(shapeKey);
    return {
      option,
      available: ok,
      reason: ok ? undefined : "Unavailable with this shape.",
    };
  });
}

export function getValidFittings(
  catalog: ConfigCatalog,
  useType: UseType | null,
  shapeKey: string | null
): OptionAvailability<FittingOpt>[] {
  return catalog.fittings.map((option) => {
    const shapeKeys = option.eligibleShapeKeys || [];
    if (shapeKey && shapeKeys.length && !shapeKeys.includes(shapeKey)) {
      return {
        option,
        available: false,
        reason: `Unavailable with this ${shapeKey} silhouette.`,
      };
    }
    if (shapeKey && !shapeKeys.length) {
      return {
        option,
        available: false,
        reason: "Not linked to this shape in the catalogue.",
      };
    }
    const uses = parseFittingUseTypes(option);
    if (useType && uses.length && !uses.includes(useType)) {
      return {
        option,
        available: false,
        reason: `Unavailable for ${useType} — try another fitting.`,
      };
    }
    return { option, available: true };
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
    if (next.sizeId && (!sizeOk || !sizeOk.available)) {
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

    const fabrics = getValidFabrics(catalog, next.shapeKey);
    const fabOk = fabrics.find((f) => f.option.id === next.fabricId);
    if (next.fabricId && (!fabOk || !fabOk.available)) {
      warnings.push(
        "Your previous fabric is not available for this shape. Please choose another fabric."
      );
      next.fabricId = null;
    }

    const linings = getValidLinings(catalog, next.shapeKey);
    const linOk = linings.find((l) => l.option.id === next.liningId);
    if (next.liningId && (!linOk || !linOk.available)) {
      warnings.push(
        "Your previous lining is not available for this shape. Please choose another lining."
      );
      next.liningId = null;
    }

    const fittings = getValidFittings(catalog, next.useType, next.shapeKey);
    const fitOk = fittings.find((f) => f.option.id === next.fittingId);
    if (next.fittingId && (!fitOk || !fitOk.available)) {
      warnings.push(
        "Your previous fitting is not available for this use or shape. Please choose another fitting."
      );
      next.fittingId = null;
    }

    const shapes = getValidShapes(catalog, next.useType);
    const shapeOk = shapes.find((s) => s.option.key === next.shapeKey);
    if (next.shapeKey && shapeOk && !shapeOk.available) {
      warnings.push(
        "Your previous shape is not available for this use. Please confirm or choose another shape."
      );
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
  const fabric = catalog.fabrics.find((f) => f.id === selection.fabricId);
  if (
    fabric &&
    selection.shapeKey &&
    fabric.eligibleShapeKeys.length &&
    !fabric.eligibleShapeKeys.includes(selection.shapeKey)
  ) {
    warnings.push("Selected fabric is not compatible with the current shape.");
  }
  const lining = catalog.linings.find((l) => l.id === selection.liningId);
  if (
    lining &&
    selection.shapeKey &&
    lining.eligibleShapeKeys.length &&
    !lining.eligibleShapeKeys.includes(selection.shapeKey)
  ) {
    warnings.push("Selected lining is not compatible with the current shape.");
  }
  const fitting = catalog.fittings.find((f) => f.id === selection.fittingId);
  if (fitting) {
    if (
      selection.shapeKey &&
      fitting.eligibleShapeKeys.length &&
      !fitting.eligibleShapeKeys.includes(selection.shapeKey)
    ) {
      warnings.push("Selected fitting is not compatible with the current shape.");
    }
    if (selection.useType) {
      const uses = parseFittingUseTypes(fitting);
      if (uses.length && !uses.includes(selection.useType)) {
        warnings.push("Selected fitting is not compatible with the current use.");
      }
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

/** Texture URL for renderer — never lifestyle/product when unusable. */
export function fabricTextureUrl(fabric: FabricOpt | null | undefined): string | null {
  if (!fabric) return null;
  if (fabric.usableAsTexture) {
    return fabric.textureImage || fabric.swatchUrl || fabric.imageUrl || null;
  }
  return null;
}
