/**
 * Import Shopify catalog (preliminary public dump) into Prisma.
 * Uses local image paths when available; falls back to CDN URL.
 * Imports ALL variants (sku = shopify variant id).
 */
const { PrismaClient, ProductType } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "shopify-catalog.json"), "utf8")
);

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapType(category) {
  if (category === "fabrics") return ProductType.FABRIC;
  if (category === "cushion-covers") return ProductType.CUSHION;
  if (category === "lampshade-kits") return ProductType.KIT;
  return ProductType.LAMPSHADE;
}

function shapeKey(category) {
  const map = {
    drum: "drum",
    empire: "empire",
    oval: "oval",
    square: "square",
    coolie: "coolie",
    rectangular: "rectangular",
    "foil-lined": "drum",
    "linen-lampshades": "drum",
    lampshades: "drum",
  };
  return map[category] || null;
}

async function main() {
  console.log("Importing", catalog.products.length, "products…");

  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.savedDesign.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.productRelation.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();

  const categoryTitles = {
    drum: "Drum Lampshades",
    empire: "Empire Lampshades",
    oval: "Oval Lampshades",
    square: "Square Lampshades",
    coolie: "Coolie Lampshades",
    rectangular: "Rectangular Lampshades",
    fabrics: "Printed Fabrics",
    "cushion-covers": "Cushion Covers",
    "lampshade-kits": "Lampshade Kits",
    "foil-lined": "Foil Lined Lampshades",
    "linen-lampshades": "Linen Lampshades",
    lampshades: "Lampshades",
  };

  const collections = {};
  let sort = 0;
  for (const [slug, title] of Object.entries(categoryTitles)) {
    collections[slug] = await prisma.collection.create({
      data: {
        slug,
        title,
        description: `${title} from the Lumina Hub handmade collection.`,
        sortOrder: sort++,
        isFeatured: ["drum", "rectangular", "fabrics", "cushion-covers"].includes(slug),
        published: true,
      },
    });
  }

  let importedProducts = 0;
  let importedVariants = 0;
  let importedImages = 0;
  let missingLocalImages = 0;
  const failures = [];

  for (const p of catalog.products) {
    try {
      const prices = p.variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
      const basePrice = prices.length ? Math.min(...prices) : 0;
      const compareAts = p.variants
        .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : null))
        .filter((n) => n && !Number.isNaN(n));
      const desc = stripHtml(p.bodyHtml) || p.title;
      const type = mapType(p.category);

      // Prefer web-friendly local images; skip heic for primary web display
      const webImages = p.images.filter((img) => {
        const pathOrSrc = (img.localPath || img.src || "").toLowerCase();
        return !pathOrSrc.includes(".heic");
      });
      const imageList = webImages.length ? webImages : p.images;

      const product = await prisma.product.create({
        data: {
          slug: p.handle,
          title: p.displayTitle || p.title,
          sourceTitle: p.title,
          subtitle:
            type === ProductType.FABRIC
              ? "Printed fabric"
              : type === ProductType.CUSHION
                ? "Cushion cover"
                : type === ProductType.KIT
                  ? "Lampshade kit"
                  : "Handmade lampshade",
          description: desc,
          shortDesc: desc.slice(0, 180),
          type,
          shapeKey: shapeKey(p.category),
          moodTags: p.tags.slice(0, 12),
          basePrice,
          compareAtPrice: compareAts.length ? Math.min(...compareAts) : null,
          published: true,
          featured: importedProducts < 12,
          bestseller: importedProducts < 8,
          handmade: true,
          leadTimeDays: 10,
          seoTitle: `${p.displayTitle || p.title} | Lumina Hub`,
          seoDesc: desc.slice(0, 155),
          configEnabled: type === ProductType.LAMPSHADE,
          shopifyProductId: p.shopifyId,
          shopifyHandle: p.handle,
          images: {
            create: imageList.map((img, idx) => {
              importedImages++;
              const url = img.localPath || img.src;
              if (!img.localPath) missingLocalImages++;
              return {
                url,
                alt: img.alt || p.displayTitle || p.title,
                sortOrder: img.position ?? idx,
                isPrimary: idx === 0,
              };
            }),
          },
          variants: {
            create: p.variants.map((v) => {
              importedVariants++;
              return {
                sku: `shopify-${v.id}`,
                title: v.title || "Default",
                priceOverride: Number(v.price),
                stock: v.available ? 25 : 0,
                active: v.available !== false,
                shopifyVariantId: v.id,
                option1: v.option1,
                option2: v.option2,
                option3: v.option3,
              };
            }),
          },
        },
      });

      const col = collections[p.category];
      if (col) {
        await prisma.collectionProduct.create({
          data: {
            collectionId: col.id,
            productId: product.id,
            sortOrder: importedProducts,
          },
        });
      }
      importedProducts++;
      if (importedProducts % 20 === 0) {
        console.log("  products", importedProducts);
      }
    } catch (e) {
      failures.push({ handle: p.handle, error: e.message });
    }
  }

  const report = {
    importedAt: new Date().toISOString(),
    source: catalog.source,
    authority: catalog.authority,
    sourceCounts: catalog.counts,
    imported: {
      products: importedProducts,
      variants: importedVariants,
      images: importedImages,
      collections: Object.keys(collections).length,
      missingLocalImages,
    },
    failures,
  };
  fs.writeFileSync(
    path.join(__dirname, "..", "data", "reconciliation-import.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report.imported, null, 2));
  console.log("failures", failures.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
