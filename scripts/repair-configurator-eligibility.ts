/**
 * Repair storefront Shape↔Size / Shape↔Fabric eligibility.
 *
 * Root cause: Phase 3 excludes needsReview=true junction rows from
 * /api/config-options. The v2.1 seed left all ShapeSize (dim heuristic)
 * and ShapeFabric (open catalogue) rows flagged needsReview, so oval/drum/etc.
 * had empty eligibleShapeKeys on the storefront.
 *
 * This script confirms dimension-appropriate size links and links every
 * active fabric to every active shape with needsReview=false (admin-equivalent).
 * Does NOT invent Empire/Coolie top/bottom diameters.
 *
 * Usage: npx tsx scripts/repair-configurator-eligibility.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAPER_KEYS = new Set(["empire", "coolie"]);
const ROUND_KEYS = new Set(["drum", "oval", "tiered", "empire", "coolie"]);
const RECT_KEYS = new Set(["square", "rectangular"]);

function isRoundSize(s: { diameterCm: unknown; widthCm: unknown }) {
  return s.diameterCm != null && s.widthCm == null;
}

function isRectSize(s: { diameterCm: unknown; widthCm: unknown }) {
  return s.widthCm != null;
}

function sizeFitsShape(
  shapeKey: string,
  size: { diameterCm: unknown; widthCm: unknown }
): boolean {
  if (ROUND_KEYS.has(shapeKey) && isRoundSize(size)) return true;
  if (RECT_KEYS.has(shapeKey) && (isRectSize(size) || isRoundSize(size)))
    return true;
  // Oval also accepts width×depth style sizes
  if (shapeKey === "oval" && (size.widthCm != null || size.diameterCm != null))
    return true;
  return false;
}

async function main() {
  const [shapes, sizes, fabrics] = await Promise.all([
    prisma.shape.findMany({ where: { active: true } }),
    prisma.size.findMany({ where: { active: true } }),
    prisma.fabric.findMany({ where: { active: true } }),
  ]);

  const summary: {
    shapeSizesConfirmed: number;
    shapeSizesSkippedTaper: number;
    shapeFabricsUpserted: number;
    perShape: Record<
      string,
      { sizesConfirmed: string[]; fabrics: number; taperBlocked: boolean }
    >;
  } = {
    shapeSizesConfirmed: 0,
    shapeSizesSkippedTaper: 0,
    shapeFabricsUpserted: 0,
    perShape: {},
  };

  for (const shape of shapes) {
    const taperBlocked = TAPER_KEYS.has(shape.key);
    const confirmedSlugs: string[] = [];

    for (const size of sizes) {
      if (!sizeFitsShape(shape.key, size)) continue;

      // Empire/Coolie: keep needsReview until real top/bottom diameters exist
      if (
        taperBlocked &&
        (size.topDiameterCm == null || size.bottomDiameterCm == null)
      ) {
        await prisma.shapeSize.upsert({
          where: {
            shapeId_sizeId: { shapeId: shape.id, sizeId: size.id },
          },
          create: {
            shapeId: shape.id,
            sizeId: size.id,
            needsReview: true,
            source: "repair_taper_awaiting_diameters",
          },
          update: {
            needsReview: true,
            source: "repair_taper_awaiting_diameters",
          },
        });
        summary.shapeSizesSkippedTaper += 1;
        continue;
      }

      await prisma.shapeSize.upsert({
        where: {
          shapeId_sizeId: { shapeId: shape.id, sizeId: size.id },
        },
        create: {
          shapeId: shape.id,
          sizeId: size.id,
          needsReview: false,
          source: "repair_confirmed_size",
        },
        update: {
          needsReview: false,
          source: "repair_confirmed_size",
        },
      });
      summary.shapeSizesConfirmed += 1;
      confirmedSlugs.push(size.slug);
    }

    let fabricCount = 0;
    for (const fabric of fabrics) {
      await prisma.shapeFabric.upsert({
        where: {
          shapeId_fabricId: { shapeId: shape.id, fabricId: fabric.id },
        },
        create: {
          shapeId: shape.id,
          fabricId: fabric.id,
          needsReview: false,
          source: "repair_confirmed_fabric",
        },
        update: {
          needsReview: false,
          source: "repair_confirmed_fabric",
        },
      });
      fabricCount += 1;
      summary.shapeFabricsUpserted += 1;
    }

    summary.perShape[shape.key] = {
      sizesConfirmed: confirmedSlugs,
      fabrics: fabricCount,
      taperBlocked,
    };
  }

  mkdirSync(join(process.cwd(), "data", "configurator"), { recursive: true });
  const out = join(
    process.cwd(),
    "data",
    "configurator",
    "eligibility-repair-report.json"
  );
  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...summary,
      },
      null,
      2
    )
  );

  console.log(`Wrote ${out}`);
  console.log(
    `Confirmed ${summary.shapeSizesConfirmed} ShapeSize rows; kept ${summary.shapeSizesSkippedTaper} taper sizes as needsReview; upserted ${summary.shapeFabricsUpserted} ShapeFabric rows.`
  );
  for (const [key, info] of Object.entries(summary.perShape)) {
    console.log(
      `  ${key}: sizes=[${info.sizesConfirmed.join(", ") || "(none confirmed)"}] fabrics=${info.fabrics}${info.taperBlocked ? " (taper — diameters still required)" : ""}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
