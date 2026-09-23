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
};

export type CartLine = {
  id: string;
  kind: "product" | "configured";
  productId?: string;
  variantId?: string;
  slug?: string;
  title: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  config?: ShadeConfig;
};

export const CART_STORAGE_KEY = "lumina_cart_v1";
export const WISHLIST_STORAGE_KEY = "lumina_wishlist_v1";
