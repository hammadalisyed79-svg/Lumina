import type { ShadeConfig } from "@/lib/cart/types";
import { configuredLineKey } from "@/lib/cart/ids";

/** Server-authored configuration snapshot frozen onto cart / order lines. */
export type ConfiguredSnapshot = {
  version: 1;
  lineKey: string;
  serverTrusted: true;
  pricedAt: string;
  shapeId: string;
  shapeKey: string;
  shapeName: string;
  sizeId: string;
  sizeSlug: string;
  sizeName: string;
  fabricId: string;
  fabricSlug: string;
  fabricName: string;
  liningId: string;
  liningSlug: string;
  liningName: string;
  fittingId: string;
  fittingSlug: string;
  fittingName: string;
  useType?: string | null;
  personalisation?: string;
  unitPrice: number;
  /** Workshop-ready measurements — nulls preserved, never invented */
  measurements: {
    diameterCm: number | null;
    heightCm: number | null;
    widthCm: number | null;
    depthCm: number | null;
    topDiameterCm: number | null;
    bottomDiameterCm: number | null;
  };
  imageUrl?: string | null;
  leadTimeNote: string;
};

export type ProductSnapshot = {
  version: 1;
  lineKey: string;
  serverTrusted: true;
  pricedAt: string;
  productId: string;
  variantId: string;
  title: string;
  sku?: string | null;
  unitPrice: number;
  imageUrl?: string | null;
  slug?: string;
};

export function snapshotToShadeConfig(snap: ConfiguredSnapshot): ShadeConfig {
  return {
    shapeKey: snap.shapeKey,
    shapeName: snap.shapeName,
    fabricSlug: snap.fabricSlug,
    fabricName: snap.fabricName,
    sizeSlug: snap.sizeSlug,
    sizeName: snap.sizeName,
    liningSlug: snap.liningSlug,
    liningName: snap.liningName,
    fittingSlug: snap.fittingSlug,
    fittingName: snap.fittingName,
    unitPrice: snap.unitPrice,
    useType: snap.useType,
    personalisation: snap.personalisation,
  };
}

export function shadeConfigFromSnapshotParts(
  snap: ConfiguredSnapshot
): ReturnType<typeof configuredLineKey> {
  return configuredLineKey(snap);
}
