/**
 * Shipping placeholder architecture — rates come only from ShippingMethod rows.
 * No invented free-shipping defaults. Checkout / test orders may omit shipping
 * until methods exist; totals then use shippingTotal = 0 with an explicit note.
 */

export type ShippingPlaceholderState =
  | { ready: true; methodCount: number }
  | { ready: false; reason: string; methodCount: 0 };

export function describeShippingPlaceholder(methodCount: number): ShippingPlaceholderState {
  if (methodCount > 0) {
    return { ready: true, methodCount };
  }
  return {
    ready: false,
    methodCount: 0,
    reason:
      "No active shipping methods configured. Shipping total will be £0.00 until methods are added in admin — not a free-shipping promise.",
  };
}

export const SHIPPING_PLACEHOLDER_COPY = {
  cartNote: "Shipping calculated at checkout when methods are available.",
  checkoutUnavailable:
    "Shipping methods are not configured yet. You can still create a test order; shipping will show as £0.00.",
  orderSummaryNote: "Shipping charged separately when rates are configured.",
} as const;
