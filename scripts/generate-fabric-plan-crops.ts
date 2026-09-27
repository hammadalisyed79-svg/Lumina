/**
 * Generate flat/plan fabric textures for Design Your Shade.
 * Prefers existing gallery plan shots; otherwise derives a flattened crop.
 *
 * Usage: npx tsx scripts/generate-fabric-plan-crops.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { resolveFabricPlanTexture } from "../src/lib/fabric-plan";
import type { CardImage } from "../src/lib/product-images";

const prisma = new PrismaClient();

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || "fabric"
  );
}

async function main() {
  const fabrics = await prisma.fabric.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const fabricProducts = await prisma.product.findMany({
    where: { type: "FABRIC", archived: false },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  const productsByTitle = new Map(
    fabricProducts.map((p) => [p.title.toLowerCase(), p])
  );
  const productsBySlug = new Map(
    fabricProducts.map((p) => [slugify(p.title), p])
  );

  const rows: {
    slug: string;
    name: string;
    source: string;
    textureImage: string;
    foldScore: number;
    fromUrl: string;
  }[] = [];

  let alreadyPlan = 0;
  let galleryPlan = 0;
  let derivedCrop = 0;

  for (const fabric of fabrics) {
    const product =
      productsByTitle.get(fabric.name.toLowerCase()) ||
      productsBySlug.get(fabric.slug) ||
      fabricProducts.find(
        (p) =>
          slugify(p.title) === fabric.slug ||
          p.slug.includes(fabric.slug.slice(0, 40)) ||
          fabric.slug.includes(slugify(p.title).slice(0, 40))
      );

    const images: CardImage[] = (product?.images || []).map((img) => ({
      url: img.url,
      alt: img.alt,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    }));

    // Prefer existing dedicated plan files if already written
    const existingPlan =
      fabric.textureImage?.includes("/media/plan/") ? fabric.textureImage : null;

    const resolved = await resolveFabricPlanTexture({
      slug: fabric.slug,
      images,
      fallbackUrls: [
        existingPlan,
        fabric.textureImage,
        fabric.swatchUrl,
        fabric.imageUrl,
      ],
      writeDerived: true,
    });

    if (!resolved) {
      console.warn(`skip ${fabric.slug}: no image`);
      continue;
    }

    if (resolved.source === "derived_crop") derivedCrop++;
    else if (resolved.source === "gallery_plan") galleryPlan++;
    else alreadyPlan++;

    await prisma.fabric.update({
      where: { id: fabric.id },
      data: {
        textureImage: resolved.url,
        swatchUrl: resolved.url,
        usableAsTexture: true,
        // Keep lifestyle/primary on imageUrl for shop PDP when present
        imageUrl: fabric.imageUrl || resolved.fromUrl,
      },
    });

    rows.push({
      slug: fabric.slug,
      name: fabric.name,
      source: resolved.source,
      textureImage: resolved.url,
      foldScore: resolved.foldScore,
      fromUrl: resolved.fromUrl,
    });

    console.log(
      `${resolved.source.padEnd(14)} ${fabric.slug.slice(0, 52)} → ${resolved.url}`
    );
  }

  mkdirSync(join(process.cwd(), "data", "configurator"), { recursive: true });
  const out = join(process.cwd(), "data", "configurator", "fabric-plan-report.json");
  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: rows.length,
        alreadyPlan,
        galleryPlan,
        derivedCrop,
        fabrics: rows,
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      { total: rows.length, alreadyPlan, galleryPlan, derivedCrop, report: out },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
