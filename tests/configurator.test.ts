import { describe, expect, it } from "vitest";
import {
  getValidFittings,
  getValidShapes,
  getValidSizes,
  invalidateAfterChange,
  sizeCompatibleWithShape,
  validateConfiguration,
} from "../src/lib/configurator/compatibility";
import { calculateShadePrice } from "../src/lib/configurator/pricing";
import { buildShadeBody } from "../src/lib/configurator/geometry";
import {
  emptySelection,
  parseConfigFromParams,
} from "../src/lib/configurator/url-state";
import type { ConfigCatalog, ConfigSelection } from "../src/lib/configurator/types";

const catalog: ConfigCatalog = {
  shapes: [
    { id: "sh1", key: "drum", name: "Drum", basePrice: 40, priceMod: 0 },
    { id: "sh2", key: "empire", name: "Empire", basePrice: 42, priceMod: 2 },
    { id: "sh3", key: "oval", name: "Oval", basePrice: 45, priceMod: 0 },
    { id: "sh4", key: "rectangular", name: "Rectangular", basePrice: 48, priceMod: 0 },
  ],
  sizes: [
    {
      id: "sz-round-40",
      slug: "40x25",
      name: "40 × 25 cm",
      priceMod: 5,
      diameterCm: 40,
      heightCm: 25,
      widthCm: null,
      depthCm: null,
      shapeKey: null,
    },
    {
      id: "sz-round-20",
      slug: "20x20",
      name: "20 × 20 cm",
      priceMod: 0,
      diameterCm: 20,
      heightCm: 20,
      widthCm: null,
      depthCm: null,
      shapeKey: null,
    },
    {
      id: "sz-rect",
      slug: "40x30x25",
      name: "40 × 30 × 25 cm",
      priceMod: 8,
      diameterCm: null,
      heightCm: 25,
      widthCm: 40,
      depthCm: 30,
      shapeKey: null,
    },
    {
      id: "sz-oval-only",
      slug: "oval-45",
      name: "Oval 45",
      priceMod: 6,
      diameterCm: 45,
      heightCm: 28,
      widthCm: 45,
      depthCm: 30,
      shapeKey: "oval",
    },
  ],
  fabrics: [
    {
      id: "fab-a",
      slug: "azure",
      name: "Azure Marble",
      priceMod: 8,
      patternScale: 1,
      material: "Velvet",
      colour: "Blue",
    },
    {
      id: "fab-b",
      slug: "linen-natural",
      name: "Natural Linen",
      priceMod: 4,
      patternScale: 1.2,
      material: "Linen",
    },
  ],
  linings: [
    { id: "lin-gold", slug: "gold", name: "Gold", priceMod: 4, colour: "Gold" },
    { id: "lin-white", slug: "white", name: "White", priceMod: 0, colour: "White" },
  ],
  fittings: [
    {
      id: "fit-clip",
      slug: "candle-clip",
      name: "Candle clip",
      priceMod: 2,
      useTypes: ["table"],
    },
    {
      id: "fit-spider",
      slug: "spider",
      name: "Spider",
      priceMod: 3,
      useTypes: ["table", "floor", "ceiling"],
    },
    {
      id: "fit-uno",
      slug: "e27-uno",
      name: "E27 Uno",
      priceMod: 3,
      useTypes: ["ceiling"],
    },
  ],
};

function sel(partial: Partial<ConfigSelection> = {}): ConfigSelection {
  return { ...emptySelection(), ...partial };
}

describe("compatibility engine", () => {
  it("marks rect-only sizes unavailable for drum", () => {
    expect(sizeCompatibleWithShape(catalog.sizes[2], "drum")).toBe(false);
    const sizes = getValidSizes(catalog, "drum");
    const rect = sizes.find((s) => s.option.id === "sz-rect");
    expect(rect?.available).toBe(false);
  });

  it("allows round sizes for drum", () => {
    expect(sizeCompatibleWithShape(catalog.sizes[0], "drum")).toBe(true);
  });

  it("scopes oval-only size to oval shape", () => {
    const forDrum = getValidSizes(catalog, "drum").find(
      (s) => s.option.id === "sz-oval-only"
    );
    const forOval = getValidSizes(catalog, "oval").find(
      (s) => s.option.id === "sz-oval-only"
    );
    expect(forDrum?.available).toBe(false);
    expect(forOval?.available).toBe(true);
  });

  it("clears incompatible size when shape changes without substituting", () => {
    const before = sel({
      useType: "table",
      shapeKey: "oval",
      sizeId: "sz-oval-only",
      liningId: "lin-gold",
      fabricId: "fab-a",
    });
    const { selection, warnings } = invalidateAfterChange(
      catalog,
      { ...before, shapeKey: "drum" },
      "shapeKey"
    );
    expect(selection.sizeId).toBeNull();
    expect(selection.liningId).toBe("lin-gold");
    expect(selection.fabricId).toBe("fab-a");
    expect(warnings.some((w) => /size/i.test(w))).toBe(true);
  });

  it("preserves compatible lining when shape changes", () => {
    const before = sel({
      shapeKey: "drum",
      sizeId: "sz-round-40",
      liningId: "lin-gold",
    });
    const { selection } = invalidateAfterChange(
      catalog,
      { ...before, shapeKey: "empire" },
      "shapeKey"
    );
    expect(selection.sizeId).toBe("sz-round-40");
    expect(selection.liningId).toBe("lin-gold");
  });

  it("clears fitting incompatible with use type", () => {
    const before = sel({
      useType: "table",
      fittingId: "fit-clip",
      shapeKey: "drum",
    });
    const { selection, warnings } = invalidateAfterChange(
      catalog,
      { ...before, useType: "ceiling" },
      "useType"
    );
    expect(selection.fittingId).toBeNull();
    expect(warnings.some((w) => /fitting/i.test(w))).toBe(true);
  });

  it("disables candle-clip for ceiling", () => {
    const fittings = getValidFittings(catalog, "ceiling");
    const clip = fittings.find((f) => f.option.slug === "candle-clip");
    expect(clip?.available).toBe(false);
  });

  it("validateConfiguration reports missing fields", () => {
    const v = validateConfiguration(catalog, emptySelection());
    expect(v.valid).toBe(false);
    expect(v.missing).toContain("use");
    expect(v.missing).toContain("fabric");
  });

  it("validateConfiguration accepts complete config", () => {
    const v = validateConfiguration(
      catalog,
      sel({
        useType: "table",
        shapeKey: "drum",
        sizeId: "sz-round-40",
        fabricId: "fab-a",
        liningId: "lin-gold",
        fittingId: "fit-spider",
      })
    );
    expect(v.valid).toBe(true);
  });

  it("use type filters recommended shapes", () => {
    const table = getValidShapes(catalog, "table");
    const rect = table.find((s) => s.option.key === "rectangular");
    expect(rect?.available).toBe(false);
  });
});

describe("pricing", () => {
  it("sums base and modifiers", () => {
    const price = calculateShadePrice(catalog, {
      shapeKey: "drum",
      sizeId: "sz-round-40",
      fabricId: "fab-a",
      liningId: "lin-gold",
      fittingId: "fit-spider",
      quantity: 1,
    });
    // 40 + 0 + 5 + 8 + 4 + 3 = 60
    expect(price.unitPrice).toBe(60);
    expect(price.fabricMod).toBe(8);
  });

  it("multiplies line total by quantity", () => {
    const price = calculateShadePrice(catalog, {
      shapeKey: "drum",
      sizeId: "sz-round-20",
      fabricId: "fab-b",
      liningId: "lin-white",
      fittingId: "fit-clip",
      quantity: 2,
    });
    expect(price.lineTotal).toBe(price.unitPrice * 2);
  });
});

describe("url state", () => {
  it("ignores invalid shape and fabric ids", () => {
    const parsed = parseConfigFromParams(catalog, {
      shape: "not-a-shape",
      fabric: "missing",
      size: "40x25",
      use: "table",
    });
    expect(parsed.shapeKey).toBeUndefined();
    expect(parsed.fabricId).toBeUndefined();
    expect(parsed.sizeId).toBe("sz-round-40");
    expect(parsed.useType).toBe("table");
  });

  it("rejects size incompatible with shape from URL", () => {
    const parsed = parseConfigFromParams(catalog, {
      shape: "drum",
      size: "oval-45",
    });
    expect(parsed.shapeKey).toBe("drum");
    expect(parsed.sizeId).toBeUndefined();
  });

  it("rejects inactive-style missing fabric selection reconstruction", () => {
    const parsed = parseConfigFromParams(catalog, { fabric: "inactive-slug" });
    expect(parsed.fabricId).toBeUndefined();
  });
});

describe("geometry", () => {
  it("drum and empire produce different silhouettes", () => {
    const drum = buildShadeBody("drum", { diameterCm: 40, heightCm: 25 });
    const empire = buildShadeBody("empire", { diameterCm: 40, heightCm: 25 });
    expect(drum.bodyPath).not.toBe(empire.bodyPath);
    expect(empire.topRx).toBeLessThan(empire.botRx);
    expect(drum.topRx).toBeCloseTo(drum.botRx, 5);
  });

  it("dimensions change proportions", () => {
    const small = buildShadeBody("drum", { diameterCm: 20, heightCm: 20 });
    const large = buildShadeBody("drum", { diameterCm: 60, heightCm: 25 });
    expect(large.botRx).toBeGreaterThan(small.botRx);
    expect(small.widthLabelCm).toBe(20);
    expect(large.widthLabelCm).toBe(60);
  });

  it("square uses rectangular body path", () => {
    const sq = buildShadeBody("square", { widthCm: 30, heightCm: 30 });
    expect(sq.bodyPath).toContain("Q");
  });
});
