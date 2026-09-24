/** Customer-facing order status labels and tracking helpers. */

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PROCESSING: "In the studio",
  PRODUCTION: "In production",
  QC: "Quality check",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partly refunded",
};

const PRODUCTION_STATUS_LABEL: Record<string, string> = {
  NONE: "Not started",
  QUEUED: "Queued",
  IN_PRODUCTION: "In production",
  QC: "Quality check",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  COMPLETE: "Complete",
};

export function formatOrderStatus(status: string) {
  return ORDER_STATUS_LABEL[status] || status.toLowerCase().replace(/_/g, " ");
}

export function formatPaymentStatus(status: string) {
  return PAYMENT_STATUS_LABEL[status] || status.toLowerCase().replace(/_/g, " ");
}

export function formatProductionStatus(status: string) {
  return PRODUCTION_STATUS_LABEL[status] || status.toLowerCase().replace(/_/g, " ");
}

export function orderStatusTone(status: string): "ok" | "warn" | "muted" | "bad" {
  if (["DELIVERED", "PAID", "CONFIRMED", "SHIPPED", "DISPATCHED"].includes(status)) return "ok";
  if (["CANCELLED", "REFUNDED", "FAILED"].includes(status)) return "bad";
  if (["AWAITING_PAYMENT", "PENDING", "UNPAID"].includes(status)) return "warn";
  return "muted";
}

/** Build a carrier tracking URL when we recognise the provider. */
export function trackingUrl(provider?: string | null, number?: string | null): string | null {
  if (!number?.trim()) return null;
  const n = encodeURIComponent(number.trim());
  const p = (provider || "").toLowerCase();
  if (/royal\s*mail|rm/.test(p)) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${n}`;
  }
  if (/evri|hermes/.test(p)) {
    return `https://www.evri.com/track/parcel/${n}`;
  }
  if (/dpd/.test(p)) {
    return `https://www.dpd.co.uk/apps/tracking/?reference=${n}`;
  }
  if (/ups/.test(p)) {
    return `https://www.ups.com/track?tracknum=${n}`;
  }
  if (/dhl/.test(p)) {
    return `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${n}`;
  }
  if (/parcelforce/.test(p)) {
    return `https://www.parcelforce.com/track-trace?trackNumber=${n}`;
  }
  if (/yodel/.test(p)) {
    return `https://www.yodel.co.uk/tracking/${n}`;
  }
  return null;
}

export function formatOrderConfig(configJson: unknown): string | null {
  if (!configJson || typeof configJson !== "object") return null;
  const c = configJson as Record<string, unknown>;
  const parts = [
    c.shapeName || c.shapeKey,
    c.fabricName || c.fabricSlug,
    c.sizeName || c.sizeSlug,
    c.liningName || c.liningSlug,
    c.fittingName || c.fittingSlug,
  ]
    .filter((x) => typeof x === "string" && x)
    .map(String);
  return parts.length ? parts.join(" · ") : null;
}
