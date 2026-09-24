import type { ConfiguredSnapshot, ProductSnapshot } from "@/lib/cart/snapshot";

export type ShadeConfig = {
  shapeKey: string;
  shapeName: string;
  fabricSlug: string;
  fabricName: string;
  sizeSlug: string;
  sizeName: string;
  liningSlug: string;
  liningName: string;
  fittingSlug: string;
  fittingName: string;
  unitPrice: number;
  useType?: string | null;
  personalisation?: string;
};

export type CartLine = {
  id: string;
  /** Structured stable key for merge/dedupe */
  lineKey: string;
  kind: "product" | "configured";
  productId?: string;
  variantId?: string;
  slug?: string;
  title: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  config?: ShadeConfig;
  /** Server-generated snapshot — preferred source of truth when present */
  snapshot?: ConfiguredSnapshot | ProductSnapshot;
  /** Validation error surfaced after server check (not silent) */
  validationError?: string;
};

export const CART_STORAGE_KEY = "lumina_cart_v2";
export const CART_STORAGE_KEY_LEGACY = "lumina_cart_v1";
export const WISHLIST_STORAGE_KEY = "lumina_wishlist_v1";
export const EDIT_CART_LINE_KEY = "lumina_edit_cart_line";
