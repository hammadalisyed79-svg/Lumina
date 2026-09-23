/**
 * Lightweight ecommerce analytics — pushes GA4-style events to dataLayer
 * when NEXT_PUBLIC_GA_MEASUREMENT_ID is set (loader in AnalyticsScript).
 */

export type AnalyticsPayload = {
  event: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      const { event, ...rest } = payload;
      window.gtag("event", event, rest);
    }
  } catch {
    /* never break UX for analytics */
  }
}

export function trackViewItem(item: {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
}) {
  track({
    event: "view_item",
    currency: item.currency || "GBP",
    value: item.price,
    items: [
      {
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
        quantity: 1,
      },
    ],
  });
}

export function trackAddToCart(item: {
  item_id?: string;
  item_name: string;
  price: number;
  quantity: number;
  currency?: string;
}) {
  track({
    event: "add_to_cart",
    currency: item.currency || "GBP",
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.item_id || item.item_name,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

export function trackPurchase(order: {
  transaction_id: string;
  value: number;
  currency?: string;
  items: { item_id?: string; item_name: string; price: number; quantity: number }[];
}) {
  track({
    event: "purchase",
    transaction_id: order.transaction_id,
    currency: order.currency || "GBP",
    value: order.value,
    items: order.items.map((i) => ({
      item_id: i.item_id || i.item_name,
      item_name: i.item_name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}
