/**
 * Seed explicit Shape↔Size/Fabric/Lining/Fitting eligibility from current catalogue.
 * High-confidence links from Size.shapeId; unscoped sizes confirmed by dimension
 * kind for non-taper shapes. Empire/Coolie size links stay needsReview until
 * top/bottom diameters exist. Open fabric×shape matrix is storefront-confirmed
 * (admins can restrict in Compatibility).
 *
 * Usage: npx tsx scripts/seed-configurator-eligibility.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { derivePatternScale } from "../src/lib/configurator/fabric-meta";
import { liningSwatchHex } from "../src/lib/studio/images";

const prisma = new PrismaClient();

type RelReport = {
  relationship: string;
  source: string;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  detail: string;
};

const report: RelReport[] = [];

function isRoundSize(s: {
  diameterCm: unknown;
  widthCm: unknown;
}): boolean {
  return s.diameterCm != null && s.widthCm == null;
}

function isRectSize(s: {
  diameterCm: unknown;
  widthCm: unknown;
}): boolean {
  return s.widthCm != null && s.diameterCm == null;
}

async function main() {
  const [shapes, sizes, fabrics, linings, fittings] = await Promise.all([
    prisma.shape.findMany({ where: { active: true } }),
    prisma.size.findMany({ where: { active: true }, include: { shape: true } }),
    prisma.fabric.findMany({ where: { active: true } }),
    prisma.lining.findMany({ where: { active: true } }),
    prisma.fitting.findMany({ where: { active: true } }),
  ]);

  // Shape useTypes defaults (stored, editable)
  const SHAPE_USES: Record<string, string[]> = {
    drum: ["table", "floor", "ceiling"],
    empire: ["table", "floor", "ceiling"],
    coolie: ["table", "floor"],
    oval: ["table", "floor", "ceiling"],
    square: ["table", "floor", "ceiling"],
    rectangular: ["floor", "ceiling"],
    tiered: ["ceiling"],
  };

  for (const shape of shapes) {
    const uses = SHAPE_USES[shape.key] || ["table", "floor", "ceiling"];
    if (!shape.useTypes?.length) {
      await prisma.shape.update({
        where: { id: shape.id },
        data: { useTypes: uses },
      });
      report.push({
        relationship: `Shape.useTypes:${shape.key}`,
        source: "seed_shape_defaults",
        confidence: "medium",
        needsReview: true,
        detail: uses.join(","),
      });
    }
  }

  // Fitting useTypes from existing slug/compatibility once, then store
  for (const f of fittings) {
    if (f.useTypes?.length) continue;
    const hay = `${f.slug} ${f.compatibility || ""}`.toLowerCase();
    const found: string[] = [];
    if (/ceiling|pendant|uno|hanging/.test(hay)) found.push("ceiling");
    if (/table|clip|candle|harp/.test(hay)) found.push("table");
    if (/floor/.test(hay)) found.push("floor");
    if (!found.length) {
      if (f.slug === "candle-clip") found.push("table");
      else if (f.slug === "e27-uno" || f.slug === "uno") found.push("ceiling");
      else if (f.slug === "spider") found.push("table", "floor", "ceiling");
    }
    await prisma.fitting.update({
      where: { id: f.id },
      data: { useTypes: found },
    });
    report.push({
      relationship: `Fitting.useTypes:${f.slug}`,
      source: "seed_fitting_slug",
      confidence: found.length ? "medium" : "low",
      needsReview: true,
      detail: found.join(",") || "empty",
    });
  }

  // Lining renderer colours
  for (const l of linings) {
    const hex = liningSwatchHex(l.name, l.colour);
    const hay = `${l.name} ${l.colour || ""}`.toLowerCase();
    let reflectivity = 0.35;
    if (/mirror|reflective|gold|copper|silver|brush/.test(hay)) reflectivity = 0.75;
    if (/white|plain|ivory|matte/.test(hay) && !/mirror|reflective/.test(hay))
      reflectivity = 0.25;
    // Distinct copper vs gold
    let rendererHex = hex;
    if (/copper/.test(hay)) rendererHex = "#b87333";
    else if (/gold|golden|brush gold|mirror gold|matte gold/.test(hay))
      rendererHex = "#d4a84b";
    else if (/silver/.test(hay)) rendererHex = "#c0c4c8";
    else if (/white|plain/.test(hay)) rendererHex = "#f7f7f5";
    else if (/ivory|champagne/.test(hay)) rendererHex = "#f0e6d2";

    await prisma.lining.update({
      where: { id: l.id },
      data: {
        rendererHex: l.rendererHex || rendererHex,
        reflectivityHint: l.reflectivityHint ?? reflectivity,
      },
    });
  }

  // Clear previous seed rows so re-run is idempotent for seed sources
  await prisma.shapeSize.deleteMany({
    where: { source: { startsWith: "seed_" } },
  });
  await prisma.shapeFabric.deleteMany({
    where: { source: { startsWith: "seed_" } },
  });
  await prisma.shapeLining.deleteMany({
    where: { source: { startsWith: "seed_" } },
  });
  await prisma.shapeFitting.deleteMany({
    where: { source: { startsWith: "seed_" } },
  });

  // ShapeSize from Size.shapeId (high confidence)
  for (const size of sizes) {
    if (size.shapeId) {
      await prisma.shapeSize.upsert({
        where: {
          shapeId_sizeId: { shapeId: size.shapeId, sizeId: size.id },
        },
        create: {
          shapeId: size.shapeId,
          sizeId: size.id,
          needsReview: false,
          source: "seed_size.shapeId",
        },
        update: { needsReview: false, source: "seed_size.shapeId" },
      });
      report.push({
        relationship: `ShapeSize:${size.shape?.key || size.shapeId}:${size.slug}`,
        source: "seed_size.shapeId",
        confidence: "high",
        needsReview: false,
        detail: size.name,
      });
      continue;
    }

    // Unscoped sizes — link by dimension kind.
    // Non-taper shapes are storefront-confirmed (empty eligibility = deny).
    // Empire/Coolie stay needsReview until real top/bottom diameters exist.
    const taperKeys = new Set(["empire", "coolie"]);
    for (const shape of shapes) {
      const roundKeys = new Set(["drum", "empire", "coolie", "oval", "tiered"]);
      const rectKeys = new Set(["rectangular", "square"]);
      let ok = false;
      if (roundKeys.has(shape.key) && isRoundSize(size)) ok = true;
      if (rectKeys.has(shape.key) && (isRectSize(size) || isRoundSize(size)))
        ok = true;
      // Oval can use width+depth or diameter
      if (shape.key === "oval" && (size.widthCm != null || size.diameterCm != null))
        ok = true;
      if (!ok) continue;

      const taperAwaiting =
        taperKeys.has(shape.key) &&
        (size.topDiameterCm == null || size.bottomDiameterCm == null);
      const needsReview = taperAwaiting;
      const source = taperAwaiting
        ? "seed_taper_awaiting_diameters"
        : "seed_dim_confirmed";

      await prisma.shapeSize.upsert({
        where: {
          shapeId_sizeId: { shapeId: shape.id, sizeId: size.id },
        },
        create: {
          shapeId: shape.id,
          sizeId: size.id,
          needsReview,
          source,
        },
        update: { needsReview, source },
      });
      report.push({
        relationship: `ShapeSize:${shape.key}:${size.slug}`,
        source,
        confidence: taperAwaiting ? "low" : "medium",
        needsReview,
        detail: taperAwaiting
          ? `${size.name} — NEEDS_REVIEW (Empire/Coolie missing top/bottom diameters)`
          : `${size.name} — confirmed by dimension kind for storefront`,
      });
    }
  }

  // Fabrics: link all active fabrics to all shapes (open catalogue).
  // Confirmed for storefront — admins can restrict per shape in Compatibility.
  for (const shape of shapes) {
    for (const fabric of fabrics) {
      await prisma.shapeFabric.upsert({
        where: {
          shapeId_fabricId: { shapeId: shape.id, fabricId: fabric.id },
        },
        create: {
          shapeId: shape.id,
          fabricId: fabric.id,
          needsReview: false,
          source: "seed_confirmed_catalogue",
        },
        update: { needsReview: false, source: "seed_confirmed_catalogue" },
      });
    }
  }
  report.push({
    relationship: "ShapeFabric:all×all",
    source: "seed_confirmed_catalogue",
    confidence: "medium",
    needsReview: false,
    detail: `${shapes.length} shapes × ${fabrics.length} fabrics — restrict in admin if needed`,
  });

  // Linings: all active linings for all shapes
  for (const shape of shapes) {
    for (const lining of linings) {
      await prisma.shapeLining.upsert({
        where: {
          shapeId_liningId: { shapeId: shape.id, liningId: lining.id },
        },
        create: {
          shapeId: shape.id,
          liningId: lining.id,
          needsReview: false,
          source: "seed_open_lining",
        },
        update: { needsReview: false, source: "seed_open_lining" },
      });
    }
  }
  report.push({
    relationship: "ShapeLining:all×all",
    source: "seed_open_lining",
    confidence: "medium",
    needsReview: false,
    detail: "Linings generally available across silhouettes",
  });

  // Fittings: intersect fitting.useTypes with shape.useTypes
  const refreshedShapes = await prisma.shape.findMany({ where: { active: true } });
  const refreshedFittings = await prisma.fitting.findMany({
    where: { active: true },
  });
  for (const shape of refreshedShapes) {
    const shapeUses = new Set(shape.useTypes || []);
    for (const fitting of refreshedFittings) {
      const fitUses = fitting.useTypes || [];
      const overlap =
        !fitUses.length ||
        !shapeUses.size ||
        fitUses.some((u) => shapeUses.has(u));
      if (!overlap) {
        report.push({
          relationship: `ShapeFitting:${shape.key}:${fitting.slug}`,
          source: "seed_use_intersect",
          confidence: "high",
          needsReview: false,
          detail: "skipped — no use-type overlap",
        });
        continue;
      }
      await prisma.shapeFitting.upsert({
        where: {
          shapeId_fittingId: { shapeId: shape.id, fittingId: fitting.id },
        },
        create: {
          shapeId: shape.id,
          fittingId: fitting.id,
          needsReview: fitUses.length === 0,
          source: "seed_use_intersect",
        },
        update: {
          needsReview: fitUses.length === 0,
          source: "seed_use_intersect",
        },
      });
      report.push({
        relationship: `ShapeFitting:${shape.key}:${fitting.slug}`,
        source: "seed_use_intersect",
        confidence: fitUses.length ? "high" : "medium",
        needsReview: fitUses.length === 0,
        detail: `shape[${[...shapeUses].join(",")}] ∩ fitting[${fitUses.join(",")}]`,
      });
    }
  }

  // Seed fabric patternScale from heuristics where still default 1 and unused texture
  for (const fabric of fabrics) {
    const scale = derivePatternScale(fabric.material, fabric.pattern, fabric.name);
    const textureCandidate = fabric.textureImage || fabric.swatchUrl || fabric.imageUrl;
    await prisma.fabric.update({
      where: { id: fabric.id },
      data: {
        patternScale: fabric.patternScale === 1 ? scale : fabric.patternScale,
        // usableAsTexture left to fabric audit script
      },
    });
    void textureCandidate;
  }

  mkdirSync(join(process.cwd(), "data", "configurator"), { recursive: true });
  const out = join(
    process.cwd(),
    "data",
    "configurator",
    "eligibility-seed-report.json"
  );
  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counts: {
          shapes: shapes.length,
          sizes: sizes.length,
          fabrics: fabrics.length,
          linings: linings.length,
          fittings: fittings.length,
          relationships: report.length,
          needsReview: report.filter((r) => r.needsReview).length,
        },
        relationships: report,
      },
      null,
      2
    )
  );
  console.log(`Wrote ${out} (${report.length} relationships)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
