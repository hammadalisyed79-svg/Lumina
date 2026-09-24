/**
 * Sync Fabric catalogue rows used by Design Your Shade from imported FABRIC products.
 * Does not overwrite adminFieldsLocked-style texture settings when Fabric already has
 * patternScale / textureImage set by admin (keeps existing texture meta if present).
 */
import { PrismaClient } from "@prisma/client";

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
  const fabricProducts = await prisma.product.findMany({
    where: { type: "FABRIC", archived: false },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 3 } },
  });

  let created = 0;
  let updated = 0;

  for (const p of fabricProducts) {
    const slug = slugify(p.title).slice(0, 60) || p.slug.slice(0, 60);
    const primary = p.images.find((i) => i.isPrimary) || p.images[0];
    const imageUrl = primary?.url || null;
    const existing = await prisma.fabric.findFirst({
      where: { OR: [{ slug }, { name: p.title }] },
    });

    if (existing) {
      await prisma.fabric.update({
        where: { id: existing.id },
        data: {
          name: existing.name || p.title,
          material: p.material || existing.material,
          imageUrl: existing.imageUrl || imageUrl,
          swatchUrl: existing.swatchUrl || imageUrl,
          // Only fill texture if empty — preserve V2.1 admin calibration
          textureImage: existing.textureImage || imageUrl,
          active: true,
          priceMod: existing.priceMod,
        },
      });
      updated++;
    } else {
      // Avoid slug collisions
      let unique = slug;
      let n = 2;
      while (await prisma.fabric.findUnique({ where: { slug: unique } })) {
        unique = `${slug}-${n++}`.slice(0, 72);
      }
      await prisma.fabric.create({
        data: {
          slug: unique,
          name: p.title,
          material: p.material,
          imageUrl,
          swatchUrl: imageUrl,
          textureImage: imageUrl,
          usableAsTexture: true,
          patternScale: 1,
          patternOffsetX: 0,
          patternOffsetY: 0,
          patternRotation: 0,
          repeatMode: "REPEAT",
          priceMod: 0,
          active: true,
        },
      });
      created++;
    }
  }

  console.log(
    JSON.stringify(
      {
        fabricProducts: fabricProducts.length,
        created,
        updated,
        totalFabrics: await prisma.fabric.count(),
      },
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
