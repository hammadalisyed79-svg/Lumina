import { describe, expect, it } from "vitest";
import {
  fabricTextureUrl,
  getValidFabrics,
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
    {
      id: "sh1",
      key: "drum",
      name: "Drum",
      basePrice: 40,
      priceMod: 0,
      useTypes: ["table", "floor", "ceiling"],
    },
    {
      id: "sh2",
      key: "empire",
      name: "Empire",
      basePrice: 42,
      priceMod: 2,
      useTypes: ["table", "floor", "ceiling"],
    },
    {
      id: "sh3",
      key: "tiered",
      name: "Tiered",
      basePrice: 50,
      priceMod: 0,
      useTypes: ["ceiling"],
    },
  ],
  sizes: [
    {
      id: "sz-40",
      slug: "40x25",
      name: "40 × 25 cm",
      priceMod: 5,
      diameterCm: 40,
      heightCm: 25,
      widthCm: null,
      depthCm: null,
      topDiameterCm: null,
      bottomDiameterCm: null,
      shapeKey: null,
      eligibleShapeKeys: ["drum", "empire"],
    },
    {
      id: "sz-oval",
      slug: "oval-45",
      name: "Oval 45",
      priceMod: 6,
      diameterCm: 45,
      heightCm: 28,
      widthCm: 45,
      depthCm: 30,
      topDiameterCm: null,
      bottomDiameterCm: null,
      shapeKey: "oval",
      eligibleShapeKeys: ["oval"],
    },
  ],
  fabrics: [
    {
      id: "fab-a",
      slug: "azure",
      name: "Azure",
      priceMod: 8,
      patternScale: 1,
      patternOffsetX: 0,
      patternOffsetY: 0,
      patternRotation: 0,
      repeatMode: "REPEAT",
      usableAsTexture: true,
      textureImage: "/media/fabrics/a.jpg",
      swatchUrl: "/media/fabrics/a.jpg",
      eligibleShapeKeys: ["drum", "empire"],
    },
    {
      id: "fab-b",
      slug: "linen",
      name: "Linen",
      priceMod: 4,
      patternScale: 1.2,
      patternOffsetX: 0,
      patternOffsetY: 0,
      patternRotation: 0,
      repeatMode: "REPEAT",
      usableAsTexture: false,
      imageUrl: "/media/lifestyle.jpg",
      eligibleShapeKeys: ["drum", "empire"],
    },
  ],
  linings: [
    {
      id: "lin-gold",
      slug: "gold",
      name: "Gold",
      priceMod: 4,
      rendererHex: "#d4a84b",
      reflectivityHint: 0.75,
      eligibleShapeKeys: ["drum", "empire"],
    },
    {
      id: "lin-white",
      slug: "white",
      name: "White",
      priceMod: 0,
      rendererHex: "#f7f7f5",
      reflectivityHint: 0.25,
      eligibleShapeKeys: ["drum", "empire"],
    },
  ],
  fittings: [
    {
      id: "fit-clip",
      slug: "candle-clip",
      name: "Candle clip",
      priceMod: 2,
      useTypes: ["table"],
      eligibleShapeKeys: ["drum", "empire"],
    },
    {
      id: "fit-spider",
      slug: "spider",
      name: "Spider",
      priceMod: 3,
      useTypes: ["table", "floor", "ceiling"],
      eligibleShapeKeys: ["drum", "empire", "tiered"],
    },
  ],
};

function sel(partial: Partial<ConfigSelection> = {}): ConfigSelection {
  return { ...emptySelection(), ...partial };
}

describe("explicit eligibility", () => {
  it("allows only sizes linked to the shape", () => {
    expect(sizeCompatibleWithShape(catalog.sizes[0], "drum")).toBe(true);
    expect(sizeCompatibleWithShape(catalog.sizes[1], "drum")).toBe(false);
    const sizes = getValidSizes(catalog, "drum");
    expect(sizes.find((s) => s.option.id === "sz-oval")?.available).toBe(false);
  });

  it("denies size with empty eligibility", () => {
    const orphan = {
      ...catalog.sizes[0],
      id: "orphan",
      eligibleShapeKeys: [] as string[],
    };
    expect(sizeCompatibleWithShape(orphan, "drum")).toBe(false);
  });

  it("clears incompatible size on shape change without substituting", () => {
    const result = invalidateAfterChange(
      catalog,
      sel({
        useType: "table",
        shapeKey: "drum",
        sizeId: "sz-oval",
        liningId: "lin-gold",
        fabricId: "fab-a",
        fittingId: "fit-spider",
      }),
      "shapeKey"
    );
    expect(result.selection.sizeId).toBeNull();
    expect(result.selection.liningId).toBe("lin-gold");
    expect(result.selection.fabricId).toBe("fab-a");
    expect(result.warnings.some((w) => /size/i.test(w))).toBe(true);
  });

  it("preserves fabric and lining when changing drum to empire", () => {
    const { selection } = invalidateAfterChange(
      catalog,
      sel({
        useType: "table",
        shapeKey: "empire",
        sizeId: "sz-40",
        fabricId: "fab-a",
        liningId: "lin-gold",
        fittingId: "fit-spider",
      }),
      "shapeKey"
    );
    expect(selection.sizeId).toBe("sz-40");
    expect(selection.fabricId).toBe("fab-a");
    expect(selection.liningId).toBe("lin-gold");
    expect(selection.fittingId).toBe("fit-spider");
  });

  it("clears fitting when use type makes it ineligible", () => {
    const { selection, warnings } = invalidateAfterChange(
      catalog,
      sel({
        useType: "ceiling",
        shapeKey: "drum",
        fittingId: "fit-clip",
      }),
      "useType"
    );
    expect(selection.fittingId).toBeNull();
    expect(warnings.some((w) => /fitting/i.test(w))).toBe(true);
  });

  it("disables shapes not listed for use type", () => {
    const shapes = getValidShapes(catalog, "table");
    expect(shapes.find((s) => s.option.key === "tiered")?.available).toBe(false);
  });

  it("filters fabrics by shape eligibility", () => {
    const fabs = getValidFabrics(catalog, "drum");
    expect(fabs.every((f) => f.available)).toBe(true);
  });

  it("filters fittings by shape and use", () => {
    const fits = getValidFittings(catalog, "table", "drum");
    expect(fits.find((f) => f.option.slug === "candle-clip")?.available).toBe(true);
    const ceiling = getValidFittings(catalog, "ceiling", "drum");
    expect(ceiling.find((f) => f.option.slug === "candle-clip")?.available).toBe(false);
  });

  it("validateConfiguration accepts a complete eligible config", () => {
    const v = validateConfiguration(
      catalog,
      sel({
        useType: "table",
        shapeKey: "drum",
        sizeId: "sz-40",
        fabricId: "fab-a",
        liningId: "lin-gold",
        fittingId: "fit-spider",
      })
    );
    expect(v.valid).toBe(true);
  });

  it("never uses lifestyle images when usableAsTexture is false", () => {
    expect(fabricTextureUrl(catalog.fabrics[1])).toBeNull();
    expect(fabricTextureUrl(catalog.fabrics[0])).toContain("a.jpg");
  });
});

describe("pricing", () => {
  it("sums modifiers", () => {
    const price = calculateShadePrice(catalog, {
      shapeKey: "drum",
      sizeId: "sz-40",
      fabricId: "fab-a",
      liningId: "lin-gold",
      fittingId: "fit-spider",
      quantity: 1,
    });
    expect(price.unitPrice).toBe(60);
  });
});

describe("url state", () => {
  it("rejects size not eligible for shape", () => {
    const parsed = parseConfigFromParams(catalog, {
      shape: "drum",
      size: "oval-45",
    });
    expect(parsed.shapeKey).toBe("drum");
    expect(parsed.sizeId).toBeUndefined();
  });
});

describe("geometry", () => {
  it("40x20 drum is wider than 30x30 drum", () => {
    const wide = buildShadeBody("drum", { diameterCm: 40, heightCm: 20 });
    const tall = buildShadeBody("drum", { diameterCm: 30, heightCm: 30 });
    expect(wide.botRx / (wide.botCy - wide.topCy)).toBeGreaterThan(
      tall.botRx / (tall.botCy - tall.topCy)
    );
  });

  it("empire taper responds to top and bottom diameters", () => {
    const gentle = buildShadeBody("empire", {
      topDiameterCm: 30,
      bottomDiameterCm: 40,
      heightCm: 25,
    });
    const sharp = buildShadeBody("empire", {
      topDiameterCm: 15,
      bottomDiameterCm: 40,
      heightCm: 25,
    });
    expect(sharp.topRx / sharp.botRx).toBeLessThan(gentle.topRx / gentle.botRx);
  });
});
