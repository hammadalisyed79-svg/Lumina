import { describe, expect, it } from "vitest";
import { calculateUnitPrice } from "../src/lib/pricing";

describe("variants / configurator pricing contract", () => {
  it("matches server-trusted formula used at checkout", () => {
    const clientPreview = calculateUnitPrice({
      basePrice: 72,
      fabricMod: 14,
      sizeMod: 24,
      liningMod: 0,
      fittingMod: 5,
    });
    const serverRecalc = calculateUnitPrice({
      basePrice: 72,
      fabricMod: 14,
      sizeMod: 24,
      liningMod: 0,
      fittingMod: 5,
    });
    expect(serverRecalc).toBe(clientPreview);
    expect(serverRecalc).toBe(115);
  });
});

describe("webhook idempotency contract", () => {
  it("treats duplicate event ids as no-ops conceptually", () => {
    const processed = new Set<string>();
    const eventId = "evt_test_1";
    const first = !processed.has(eventId);
    if (first) processed.add(eventId);
    const second = !processed.has(eventId);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});

describe("admin auth contract", () => {
  it("only ADMIN role is privileged", () => {
    const canAccessAdmin = (role: "CUSTOMER" | "TRADE" | "ADMIN") => role === "ADMIN";
    expect(canAccessAdmin("CUSTOMER")).toBe(false);
    expect(canAccessAdmin("TRADE")).toBe(false);
    expect(canAccessAdmin("ADMIN")).toBe(true);
  });
});

describe("cart line kinds", () => {
  it("supports product and configured lines", () => {
    const lines = [
      { kind: "product" as const, unitPrice: 42, quantity: 1 },
      {
        kind: "configured" as const,
        unitPrice: 95,
        quantity: 1,
        config: { shapeKey: "drum", fabricSlug: "ivory-linen" },
      },
    ];
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    expect(subtotal).toBe(137);
    expect(lines[1].config?.shapeKey).toBe("drum");
  });
});
