/**
 * Phase 3 assertion runner (vitest env currently reports empty suites under Cursor's node).
 * Run: node --import tsx scripts/phase3-selftest.ts
 */
import assert from "node:assert/strict";
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

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}

check("configured line key", () => {
  const key = configuredLineKey({
    shapeKey: "drum",
    sizeSlug: "40cm",
    fabricSlug: "ivory-linen",
    liningSlug: "gold",
    fittingSlug: "spider",
  });
  assert.equal(parseConfiguredKey(key)?.fabricSlug, "ivory-linen");
  assert.equal(productLineKey("p1", "v1"), "prd:p1:v1");
});

check("orderability blockers", () => {
  assert.equal(
    taperDiametersMissing({
      shapeKey: "empire",
      topDiameterCm: null,
      bottomDiameterCm: 40,
    })?.code,
    "MISSING_TAPER_DIAMETERS"
  );
  assert.equal(unscopedSizeBlock([])?.code, "UNSCOPED_SIZE");
  assert.equal(
    eligibilityBlock({ kind: "fabric", hasRow: true, needsReview: true })?.code,
    "ELIGIBILITY_NEEDS_REVIEW"
  );
});

check("sizeOrderableForShape taper", () => {
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
  assert.equal(sizeOrderableForShape(size, "empire").ok, false);
});

check("server pricing + totals", () => {
  assert.equal(
    calculateUnitPrice({
      basePrice: 72,
      fabricMod: 8,
      sizeMod: 10,
      liningMod: 14,
      fittingMod: 0,
    }),
    104
  );
  const totals = calculateOrderTotals({
    lines: [
      { basePrice: 100, quantity: 2 },
      { basePrice: 50, quantity: 1 },
    ],
    coupon: { type: "PERCENT", value: 10 },
    shipping: { calcType: "FLAT", price: 8.5 },
  });
  assert.equal(totals.subtotal, 250);
  assert.equal(totals.discountTotal, 25);
  assert.equal(totals.total, 233.5);
});

check("snapshot persistence", () => {
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
  assert.equal(isConfiguredSnapshot(snap), true);
  assert.ok(workshopConfigRows(snap).some((r) => r.value === "Drum"));
});

check("LH numbering + permissions + shipping placeholder", () => {
  assert.equal(formatOrderNumber(1), "LH-000001");
  const keys = PERMISSION_CATALOG.map((p) => p.key);
  for (const k of ["orders.view", "orders.edit", "orders.fulfil", "orders.notes"]) {
    assert.ok(keys.includes(k), k);
  }
  assert.equal(describeShippingPlaceholder(0).ready, false);
});

console.log(`\n${passed} checks passed`);
