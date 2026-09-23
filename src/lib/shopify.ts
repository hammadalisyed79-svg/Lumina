/**
 * Shopify Storefront API client + cart permalink checkout.
 * Prefers Storefront API when SHOPIFY_STOREFRONT_TOKEN is set.
 * Falls back to Shopify cart permalinks on the public storefront domain
 * (works for luminahub.co.uk without a Storefront token).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export class ShopifyNotConfiguredError extends Error {
  constructor(message = "Shopify checkout is not configured") {
    super(message);
    this.name = "ShopifyNotConfiguredError";
  }
}

export function isShopifyConfigured() {
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN &&
      token &&
      !token.includes("placeholder")
  );
}

/** Public storefront used for cart permalinks (custom domain or *.myshopify.com). */
export function getShopifyCheckoutBaseUrl() {
  const raw =
    process.env.SHOPIFY_CHECKOUT_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    "https://www.luminahub.co.uk";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

/** Checkout can run via Storefront API or cart permalink. */
export function isCheckoutLive() {
  return isShopifyConfigured() || Boolean(getShopifyCheckoutBaseUrl());
}

function endpoint() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain || !process.env.SHOPIFY_STOREFRONT_TOKEN) {
    throw new ShopifyNotConfiguredError();
  }
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2025-01";
  return `https://${domain}/api/${version}/graphql.json`;
}

export async function shopifyStorefront<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Shopify Storefront HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}

const CART_CREATE = `
mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { id checkoutUrl totalQuantity }
    userErrors { field message }
  }
}`;

const CART_LINES_ADD = `
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { id checkoutUrl totalQuantity }
    userErrors { field message }
  }
}`;

export type ShopifyCartLine = {
  merchandiseId: string;
  quantity: number;
  attributes?: { key: string; value: string }[];
};

export async function createShopifyCheckout(
  lines: ShopifyCartLine[],
  cartAttributes?: { key: string; value: string }[]
) {
  if (!isShopifyConfigured()) throw new ShopifyNotConfiguredError();
  const data = await shopifyStorefront<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: { message: string }[];
    };
  }>(CART_CREATE, {
    input: {
      lines: lines.map((l) => ({
        merchandiseId: l.merchandiseId,
        quantity: l.quantity,
        attributes: l.attributes,
      })),
      attributes: cartAttributes,
    },
  });
  if (data.cartCreate.userErrors?.length) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; "));
  }
  if (!data.cartCreate.cart?.checkoutUrl) {
    throw new Error("Shopify cart created without checkoutUrl");
  }
  return data.cartCreate.cart;
}

export function variantGid(numericId: string) {
  if (numericId.startsWith("gid://")) return numericId;
  return `gid://shopify/ProductVariant/${numericId}`;
}

export function variantNumericId(id: string) {
  if (!id.startsWith("gid://")) return id.replace(/\D/g, "") || id;
  const parts = id.split("/");
  return parts[parts.length - 1];
}

/**
 * Cart permalink → Shopify hosted checkout (no Storefront token required).
 * https://shopify.dev/docs/apps/build/checkout/cart-permalinks
 */
export function buildCartPermalink(
  lines: { shopifyVariantId: string; quantity: number }[]
) {
  const base = getShopifyCheckoutBaseUrl();
  const path = lines
    .map((l) => `${variantNumericId(l.shopifyVariantId)}:${Math.max(1, l.quantity)}`)
    .join(",");
  return `${base}/cart/${path}`;
}

export function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader || secret.includes("placeholder")) return false;
  const digest = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export { CART_LINES_ADD };
