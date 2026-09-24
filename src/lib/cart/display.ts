import { buildStudioSharePath } from "@/lib/studio/fabric-family";
import type { CartLine, ShadeConfig } from "@/lib/cart/types";

export const CART_CHECKOUT_SNAPSHOT_KEY = "lumina_cart_checkout_snap";

export function cartLineKindLabel(kind: CartLine["kind"]) {
  return kind === "configured" ? "Studio design" : "Catalogue";
}

export function formatCartConfig(config: ShadeConfig, compact = false) {
  if (compact) {
    return [config.shapeName, config.fabricName, config.sizeName]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    config.shapeName,
    config.fabricName,
    config.sizeName,
    config.liningName,
    config.fittingName,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function cartLineHref(item: CartLine): string | null {
  if (item.kind === "product" && item.slug) {
    return `/product/${item.slug}`;
  }
  if (item.kind === "configured" && item.config) {
    return buildStudioSharePath({
      shapeKey: item.config.shapeKey,
      fabricSlug: item.config.fabricSlug,
      sizeSlug: item.config.sizeSlug,
      liningSlug: item.config.liningSlug,
      fittingSlug: item.config.fittingSlug,
      step: 5,
    });
  }
  return null;
}

export function sameConfigured(a: ShadeConfig, b: ShadeConfig) {
  return (
    a.shapeKey === b.shapeKey &&
    a.fabricSlug === b.fabricSlug &&
    a.sizeSlug === b.sizeSlug &&
    a.liningSlug === b.liningSlug &&
    a.fittingSlug === b.fittingSlug
  );
}
