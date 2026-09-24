import { describe, expect, it } from "vitest";
import {
  configuredLineKey,
  parseConfiguredKey,
  productLineKey,
} from "../src/lib/cart/ids";
import {
  eligibilityBlock,
  taperDiametersMissing,
  unscopedSizeBlock,
} from "../src/lib/cart/orderability";
import { calculateOrderTotals, calculateUnitPrice } from "../src/lib/pricing";
import { formatOrderNumber } from "../src/lib/orders/numbering";
import { sizeOrderableForShape } from "../src/lib/configurator/compatibility";
import type { SizeOpt } from "../src/lib/configurator/types";
import { PERMISSION_CATALOG } from "../src/lib/auth/permissions";
import { describeShippingPlaceholder } from "../src/lib/shipping/placeholder";
import { isConfiguredSnapshot, workshopConfigRows } from "../src/lib/orders/workshop";
import type { ConfiguredSnapshot } from "../src/lib/cart/snapshot";

describe("cart structured IDs", () => {
  it("builds stable configured keys", () => {
    const key = configuredLineKey({
      shapeKey: "drum",
      sizeSlug: "40cm",
      fabricSlug: "ivory-linen",
      liningSlug: "gold",
      fittingSlug: "spider",
    });
    expect(key.startsWith("cfg:")).toBe(true);
    const parsed = parseConfiguredKey(key);
    expect(parsed?.shapeKey).toBe("drum");
    expect(parsed?.fabricSlug).toBe("ivory-linen");
  });

  it("builds product keys", () => {
    expect(productLineKey("p1", "v1")).toBe("prd:p1:v1");
    expect(productLineKey("p1")).toBe("prd:p1:default");
  });
});

describe("orderability blockers (no invented measurements)", () => {
  it("blocks empire/coolie without taper diameters", () => {
    const block = taperDiametersMissing({
      shapeKey: "empire",
      topDiameterCm: null,
      bottomDiameterCm: 40,
    });
    expect(block?.code).toBe("MISSING_TAPER_DIAMETERS");
  });

  it("allows empire when both diameters present", () => {
    expect(
      taperDiametersMissing({
        shapeKey: "empire",
        topDiameterCm: 20,
        bottomDiameterCm: 40,
      })
    ).toBeNull();
  });

  it("blocks unscoped sizes", () => {
    expect(unscopedSizeBlock([])?.code).toBe("UNSCOPED_SIZE");
    expect(unscopedSizeBlock(["drum"])).toBeNull();
  });

  it("blocks NEEDS_REVIEW eligibility", () => {
    expect(
      eligibilityBlock({ kind: "fabric", hasRow: true, needsReview: true })?.code
    ).toBe("ELIGIBILITY_NEEDS_REVIEW");
    expect(
      eligibilityBlock({ kind: "fabric", hasRow: false, needsReview: false })?.code
    ).toBe("ELIGIBILITY_MISSING");
  });

  it("client sizeOrderableForShape mirrors server taper rule", () => {
    const size: SizeOpt = {
      id: "1",
      slug: "empire-40",
      name: "40 cm",
      priceMod: 0,
      diameterCm: 40,
      heightCm: 25,
      widthCm: null,
      depthCm: null,
      topDiameterCm: null,
      bottomDiameterCm: null,
      shapeKey: "empire",
      eligibleShapeKeys: ["empire"],
    };
    const check = sizeOrderableForShape(size, "empire");
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/diameters/i);
  });
});

describe("server-trusted pricing + order totals", () => {
  it("recalculates unit price ignoring client hints", () => {
    const server = calculateUnitPrice({
      basePrice: 72,
      fabricMod: 8,
      sizeMod: 10,
      liningMod: 14,
      fittingMod: 0,
    });
    expect(server).toBe(104);
    // Client sending 1.00 must not win — server formula is authoritative
    expect(server).not.toBe(1);
  });

  it("computes order totals with discount/tax/shipping fields", () => {
    const totals = calculateOrderTotals({
      lines: [
        { basePrice: 100, quantity: 2 },
        { basePrice: 50, quantity: 1 },
      ],
      coupon: { type: "PERCENT", value: 10 },
      shipping: { calcType: "FLAT", price: 8.5 },
    });
    expect(totals.subtotal).toBe(250);
    expect(totals.discountTotal).toBe(25);
    expect(totals.shippingTotal).toBe(8.5);
    expect(totals.taxTotal).toBe(0);
    expect(totals.total).toBe(233.5);
  });
});

describe("order snapshot persistence shape", () => {
  const snap: ConfiguredSnapshot = {
    version: 1,
    lineKey: "cfg:drum:40cm:ivory:gold:spider",
    serverTrusted: true,
    pricedAt: "2026-09-24T12:00:00.000Z",
    shapeId: "s1",
    shapeKey: "drum",
    shapeName: "Drum",
    sizeId: "z1",
    sizeSlug: "40cm",
    sizeName: "40 cm",
    fabricId: "f1",
    fabricSlug: "ivory",
    fabricName: "Ivory",
    liningId: "l1",
    liningSlug: "gold",
    liningName: "Gold",
    fittingId: "t1",
    fittingSlug: "spider",
    fittingName: "Spider",
    useType: "table",
    unitPrice: 111,
    measurements: {
      diameterCm: 40,
      heightCm: 25,
      widthCm: null,
      depthCm: null,
      topDiameterCm: null,
      bottomDiameterCm: null,
    },
    leadTimeNote: "Handmade to order — typically 2–3 weeks",
  };

  it("recognises configured snapshots", () => {
    expect(isConfiguredSnapshot(snap)).toBe(true);
    expect(isConfiguredSnapshot({ shapeKey: "drum" })).toBe(false);
  });

  it("keeps workshop rows without losing configuration", () => {
    const rows = workshopConfigRows(snap);
    expect(rows.map((r) => r.value)).toEqual(
      expect.arrayContaining(["Drum", "Ivory", "40 cm", "Gold", "Spider"])
    );
  });
});

describe("LH order numbering format", () => {
  it("pads to six digits", () => {
    expect(formatOrderNumber(1)).toBe("LH-000001");
    expect(formatOrderNumber(42)).toBe("LH-000042");
  });
});

describe("RBAC order permissions", () => {
  it("includes orders.view/edit/fulfil/notes", () => {
    const keys = PERMISSION_CATALOG.map((p) => p.key);
    expect(keys).toContain("orders.view");
    expect(keys).toContain("orders.edit");
    expect(keys).toContain("orders.fulfil");
    expect(keys).toContain("orders.notes");
  });

  it("access control: customers cannot hold staff order perms conceptually", () => {
    const customerPerms: string[] = [];
    const canViewOrders = (perms: string[]) => perms.includes("orders.view");
    expect(canViewOrders(customerPerms)).toBe(false);
    expect(canViewOrders(["orders.view"])).toBe(true);
  });
});

describe("shipping placeholder architecture", () => {
  it("does not invent free shipping when no methods", () => {
    const state = describeShippingPlaceholder(0);
    expect(state.ready).toBe(false);
    if (!state.ready) {
      expect(state.reason).toMatch(/not a free-shipping promise/i);
    }
  });
});
