import { describe, expect, it } from "vitest";
import {
  applyCoupon,
  calculateLineTotal,
  calculateOrderTotals,
  calculateShipping,
  calculateUnitPrice,
} from "../src/lib/pricing";

describe("pricing", () => {
  it("calculates unit price from mods", () => {
    expect(
      calculateUnitPrice({
        basePrice: 68,
        fabricMod: 8,
        sizeMod: 12,
        liningMod: 4,
        fittingMod: 3,
      }),
    ).toBe(95);
  });

  it("calculates line totals", () => {
    expect(calculateLineTotal({ basePrice: 50, quantity: 3 })).toBe(150);
  });
});

describe("coupons", () => {
  it("applies percent coupon", () => {
    const r = applyCoupon(100, { type: "PERCENT", value: 10 });
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(10);
  });

  it("rejects below minimum", () => {
    const r = applyCoupon(40, { type: "FIXED", value: 15, minSubtotal: 80 });
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
  });

  it("caps fixed coupon at subtotal", () => {
    const r = applyCoupon(10, { type: "FIXED", value: 15 });
    expect(r.discount).toBe(10);
  });
});

describe("shipping", () => {
  it("is free above threshold", () => {
    expect(
      calculateShipping(80, {
        calcType: "FREE_ABOVE",
        price: 4.95,
        freeAbove: 75,
      }),
    ).toBe(0);
  });

  it("charges flat below threshold", () => {
    expect(
      calculateShipping(50, {
        calcType: "FREE_ABOVE",
        price: 4.95,
        freeAbove: 75,
      }),
    ).toBe(4.95);
  });
});

describe("order totals", () => {
  it("aggregates cart lines with coupon and shipping", () => {
    const totals = calculateOrderTotals({
      lines: [
        { basePrice: 68, fabricMod: 8, quantity: 1 },
        { basePrice: 42, quantity: 2 },
      ],
      coupon: { type: "PERCENT", value: 10 },
      shipping: { calcType: "FREE_ABOVE", price: 4.95, freeAbove: 75 },
    });
    expect(totals.subtotal).toBe(160);
    expect(totals.discountTotal).toBe(16);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.total).toBe(144);
  });
});
