import type { CartLine, ShadeConfig } from "@/lib/cart/types";

/** Structured cart line identity — stable across sessions for merge/dedupe. */
export function configuredLineKey(config: Pick<
  ShadeConfig,
  "shapeKey" | "sizeSlug" | "fabricSlug" | "liningSlug" | "fittingSlug"
>): string {
  return [
    "cfg",
    config.shapeKey,
    config.sizeSlug,
    config.fabricSlug,
    config.liningSlug,
    config.fittingSlug,
  ]
    .map(encodeURIComponent)
    .join(":");
}

export function productLineKey(productId: string, variantId?: string | null): string {
  return ["prd", productId, variantId || "default"].map(encodeURIComponent).join(":");
}

export function cartLineKey(line: Pick<CartLine, "kind" | "productId" | "variantId" | "config">): string {
  if (line.kind === "configured" && line.config) {
    return configuredLineKey(line.config);
  }
  if (line.productId) {
    return productLineKey(line.productId, line.variantId);
  }
  return `tmp:${Math.random().toString(36).slice(2)}`;
}

export function parseConfiguredKey(key: string): {
  shapeKey: string;
  sizeSlug: string;
  fabricSlug: string;
  liningSlug: string;
  fittingSlug: string;
} | null {
  const parts = key.split(":").map(decodeURIComponent);
  if (parts[0] !== "cfg" || parts.length < 6) return null;
  return {
    shapeKey: parts[1],
    sizeSlug: parts[2],
    fabricSlug: parts[3],
    liningSlug: parts[4],
    fittingSlug: parts[5],
  };
}
