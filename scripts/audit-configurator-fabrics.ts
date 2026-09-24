/**
 * Audit fabrics for configurator texture suitability.
 * Usage: npx tsx scripts/audit-configurator-fabrics.ts
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { catalogImageUrl } from "../src/lib/studio/images";
import { derivePatternScale } from "../src/lib/configurator/fabric-meta";

const prisma = new PrismaClient();

function classifyImage(url: string | null, name: string): {
  usableAsTexture: boolean;
  kind: string;
  reason: string;
  recommendedAction: string;
} {
  if (!url) {
    return {
      usableAsTexture: false,
      kind: "missing",
      reason: "No image URL",
      recommendedAction: "Upload a flat fabric swatch or detail crop",
    };
  }
  const u = url.toLowerCase();
  const n = name.toLowerCase();

  if (/lifestyle|room|hero|interior|scene|setting|home/.test(u + n)) {
    return {
      usableAsTexture: false,
      kind: "lifestyle",
      reason: "URL/name suggests lifestyle or room photography",
      recommendedAction: "Replace with flat fabric detail; keep as gallery only",
    };
  }
  if (/lampshade|shade-|product\/|finished|on-lamp|pendant/.test(u)) {
    return {
      usableAsTexture: false,
      kind: "finished_product",
      reason: "Looks like a finished shade / product photo",
      recommendedAction: "Use a flat fabric crop as textureImage",
    };
  }
  if (/swatch|fabric|textile|detail|close|print|pattern|velvet|linen|damask|moire|moir/.test(u + n)) {
    return {
      usableAsTexture: true,
      kind: "fabric_detail",
      reason: "Filename/name suggests fabric or swatch detail",
      recommendedAction: "Confirm in admin preview; tune patternScale if needed",
    };
  }
  // Local media products — often product shots
  if (u.includes("/media/products/") || u.includes("/catalog/")) {
    return {
      usableAsTexture: false,
      kind: "product_or_unknown",
      reason: "Catalogue product path — may be finished shade, not flat cloth",
      recommendedAction: "Inspect visually; set usableAsTexture only if flat fabric",
    };
  }
  return {
    usableAsTexture: false,
    kind: "unsuitable_or_unknown",
    reason: "Cannot verify flat fabric from path alone",
    recommendedAction: "Manual review — set textureImage + usableAsTexture in admin",
  };
}

async function main() {
  const fabrics = await prisma.fabric.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const rows = [];
  for (const f of fabrics) {
    const source = catalogImageUrl(f.textureImage, f.swatchUrl, f.imageUrl);
    const classified = classifyImage(source, f.name);
    const scale = f.patternScale !== 1 ? f.patternScale : derivePatternScale(f.material, f.pattern, f.name);

    // Persist classification + seed scale; never mark lifestyle as usable
    await prisma.fabric.update({
      where: { id: f.id },
      data: {
        usableAsTexture: classified.usableAsTexture,
        patternScale: scale,
        // Prefer swatch as texture when usable and no dedicated texture yet
        textureImage:
          f.textureImage ||
          (classified.usableAsTexture ? catalogImageUrl(f.swatchUrl, f.imageUrl) : null),
      },
    });

    rows.push({
      fabricId: f.id,
      name: f.name,
      slug: f.slug,
      sourceImage: source,
      swatchUrl: f.swatchUrl,
      imageUrl: f.imageUrl,
      textureImage: f.textureImage,
      kind: classified.kind,
      usableAsTexture: classified.usableAsTexture,
      reason: classified.reason,
      recommendedAction: classified.recommendedAction,
      patternScale: scale,
    });
  }

  mkdirSync(join(process.cwd(), "data", "configurator"), { recursive: true });
  const out = join(process.cwd(), "data", "configurator", "fabric-audit.json");
  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: rows.length,
        usableAsTexture: rows.filter((r) => r.usableAsTexture).length,
        needsTexture: rows.filter((r) => !r.usableAsTexture).length,
        fabrics: rows,
      },
      null,
      2
    )
  );
  console.log(`Wrote ${out}`);
  console.log(
    `usable=${rows.filter((r) => r.usableAsTexture).length} / ${rows.length}`
  );
  void existsSync;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
