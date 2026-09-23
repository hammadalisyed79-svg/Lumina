/**
 * Shopify Storefront API client.
 * Requires SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN.
 * When unset, helpers return null / throw ShopifyNotConfiguredError.
 */

export class ShopifyNotConfiguredError extends Error {
  constructor(message = "Shopify Storefront API is not configured") {
    super(message);
    this.name = "ShopifyNotConfiguredError";
  }
}

export function isShopifyConfigured() {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_TOKEN
  );
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
  merchandiseId: string; // gid://shopify/ProductVariant/...
  quantity: number;
  attributes?: { key: string; value: string }[];
};

export async function createShopifyCheckout(lines: ShopifyCartLine[]) {
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

export { CART_LINES_ADD };
