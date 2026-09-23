import { Decimal } from "@prisma/client/runtime/library";

export type Money = number | string | Decimal;

export function toNumber(value: Money): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type PricingInput = {
  basePrice: Money;
  fabricMod?: Money;
  sizeMod?: Money;
  liningMod?: Money;
  fittingMod?: Money;
  quantity?: number;
};

export function calculateUnitPrice(input: PricingInput): number {
  const unit = roundMoney(
    toNumber(input.basePrice) +
      toNumber(input.fabricMod ?? 0) +
      toNumber(input.sizeMod ?? 0) +
      toNumber(input.liningMod ?? 0) +
      toNumber(input.fittingMod ?? 0),
  );
  return unit;
}

export function calculateLineTotal(input: PricingInput): number {
  const qty = Math.max(1, input.quantity ?? 1);
  return roundMoney(calculateUnitPrice(input) * qty);
}

export type CouponInput = {
  type: "PERCENT" | "FIXED";
  value: Money;
  minSubtotal?: Money | null;
};

export function applyCoupon(
  subtotal: number,
  coupon: CouponInput | null | undefined,
): { discount: number; valid: boolean; reason?: string } {
  if (!coupon) return { discount: 0, valid: true };
  const min = coupon.minSubtotal != null ? toNumber(coupon.minSubtotal) : 0;
  if (subtotal < min) {
    return {
      discount: 0,
      valid: false,
      reason: `Minimum order £${min.toFixed(2)} required`,
    };
  }
  const value = toNumber(coupon.value);
  if (coupon.type === "PERCENT") {
    return { discount: roundMoney((subtotal * value) / 100), valid: true };
  }
  return { discount: roundMoney(Math.min(value, subtotal)), valid: true };
}

export type ShippingInput = {
  calcType: "FLAT" | "FREE_ABOVE" | "WEIGHT";
  price: Money;
  freeAbove?: Money | null;
};

export function calculateShipping(
  subtotalAfterDiscount: number,
  method: ShippingInput | null | undefined,
): number {
  // No invented free-shipping defaults — only use an explicit ShippingMethod row.
  if (!method) return 0;
  const price = toNumber(method.price);
  if (method.calcType === "FLAT") return roundMoney(price);
  if (method.calcType === "FREE_ABOVE") {
    if (method.freeAbove == null) return roundMoney(price);
    const threshold = toNumber(method.freeAbove);
    return subtotalAfterDiscount >= threshold ? 0 : roundMoney(price);
  }
  return roundMoney(price);
}

export function calculateOrderTotals(args: {
  lines: PricingInput[];
  coupon?: CouponInput | null;
  shipping?: ShippingInput | null;
}) {
  const subtotal = roundMoney(
    args.lines.reduce((sum, line) => sum + calculateLineTotal(line), 0),
  );
  const { discount } = applyCoupon(subtotal, args.coupon);
  const afterDiscount = roundMoney(Math.max(0, subtotal - discount));
  // Local estimate only; Shopify checkout remains SoT for live shipping.
  const shippingTotal = calculateShipping(afterDiscount, args.shipping);
  const taxTotal = 0;
  const total = roundMoney(afterDiscount + shippingTotal + taxTotal);
  return { subtotal, discountTotal: discount, shippingTotal, taxTotal, total };
}
