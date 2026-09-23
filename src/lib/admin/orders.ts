export function paymentBadgeClass(status: string) {
  if (status === "PAID") return "admin-badge is-ok";
  if (status === "FAILED" || status === "UNPAID") return "admin-badge is-danger";
  if (status === "PENDING") return "admin-badge is-warn";
  return "admin-badge is-muted";
}

export function orderBadgeClass(status: string) {
  if (status === "DELIVERED" || status === "SHIPPED" || status === "DISPATCHED") {
    return "admin-badge is-ok";
  }
  if (status === "CANCELLED" || status === "REFUNDED") return "admin-badge is-danger";
  if (status === "AWAITING_PAYMENT" || status === "PENDING") return "admin-badge is-warn";
  return "admin-badge";
}

export function formatConfigSnippet(configJson: unknown): string {
  if (!configJson || typeof configJson !== "object") return "";
  const c = configJson as Record<string, unknown>;
  return [
    c.shapeName || c.shapeKey,
    c.fabricName || c.fabricSlug,
    c.sizeName || c.sizeSlug,
    c.liningName || c.liningSlug,
    c.fittingName || c.fittingSlug,
  ]
    .filter((x) => typeof x === "string" && x)
    .join(" · ");
}

export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "PRODUCTION",
  "QC",
  "PACKED",
  "SHIPPED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
