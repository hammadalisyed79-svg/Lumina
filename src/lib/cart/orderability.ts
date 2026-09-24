/**
 * Pre-order / cart blockers for configured shades.
 * Never invent measurements — uncertain catalogue options must not be orderable.
 */

export const TAPER_SHAPES = new Set(["empire", "coolie"]);

export type OrderabilityBlock = {
  code:
    | "MISSING_OPTION"
    | "INACTIVE"
    | "UNSCOPED_SIZE"
    | "ELIGIBILITY_MISSING"
    | "ELIGIBILITY_NEEDS_REVIEW"
    | "MISSING_TAPER_DIAMETERS"
    | "PRODUCT_UNAVAILABLE"
    | "VARIANT_UNAVAILABLE";
  message: string;
  field?: string;
};

export function taperDiametersMissing(args: {
  shapeKey: string;
  topDiameterCm: number | null | undefined;
  bottomDiameterCm: number | null | undefined;
}): OrderabilityBlock | null {
  if (!TAPER_SHAPES.has(args.shapeKey.toLowerCase())) return null;
  if (args.topDiameterCm == null || args.bottomDiameterCm == null) {
    return {
      code: "MISSING_TAPER_DIAMETERS",
      message:
        "Empire/Coolie sizes need confirmed top and bottom diameters before they can be ordered. This size is blocked until an admin enters real measurements.",
      field: "size",
    };
  }
  return null;
}

export function eligibilityBlock(args: {
  kind: "size" | "fabric" | "lining" | "fitting";
  hasRow: boolean;
  needsReview: boolean;
}): OrderabilityBlock | null {
  if (!args.hasRow) {
    return {
      code: "ELIGIBILITY_MISSING",
      message: `${args.kind} is not linked to this shape in the catalogue.`,
      field: args.kind,
    };
  }
  if (args.needsReview) {
    return {
      code: "ELIGIBILITY_NEEDS_REVIEW",
      message: `${args.kind} × shape compatibility is flagged NEEDS_REVIEW and cannot be ordered until confirmed.`,
      field: args.kind,
    };
  }
  return null;
}

export function unscopedSizeBlock(eligibleShapeKeys: string[]): OrderabilityBlock | null {
  if (!eligibleShapeKeys.length) {
    return {
      code: "UNSCOPED_SIZE",
      message:
        "This size is unscoped (no confirmed shape eligibility) and cannot be ordered.",
      field: "size",
    };
  }
  return null;
}
