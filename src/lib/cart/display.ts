import type { CartLine, ShadeConfig } from "@/lib/cart/types";
import { isConfiguredSnapshot } from "@/lib/orders/workshop";

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

/** Edit Design round-trip — restores bag configuration in Design Your Shade. */
export function editConfiguredHref(item: CartLine): string | null {
  if (item.kind !== "configured") return null;
  const snap = isConfiguredSnapshot(item.snapshot) ? item.snapshot : null;
  const cfg = snap || item.config;
  if (!cfg) return null;
  const p = new URLSearchParams();
  const useType =
    ("useType" in cfg ? cfg.useType : null) ||
    (snap && "useType" in snap ? snap.useType : null);
  if (useType) p.set("use", String(useType));
  p.set("shape", "shapeKey" in cfg ? cfg.shapeKey : snap!.shapeKey);
  p.set("size", "sizeSlug" in cfg ? cfg.sizeSlug : snap!.sizeSlug);
  p.set("fabric", "fabricSlug" in cfg ? cfg.fabricSlug : snap!.fabricSlug);
  p.set("lining", "liningSlug" in cfg ? cfg.liningSlug : snap!.liningSlug);
  p.set("fitting", "fittingSlug" in cfg ? cfg.fittingSlug : snap!.fittingSlug);
  p.set("step", "review");
  p.set("editCart", item.id);
  return `/design-your-shade?${p.toString()}`;
}

export function cartLineHref(item: CartLine): string | null {
  if (item.kind === "product" && item.slug) {
    return `/product/${item.slug}`;
  }
  if (item.kind === "configured") {
    return editConfiguredHref(item);
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
