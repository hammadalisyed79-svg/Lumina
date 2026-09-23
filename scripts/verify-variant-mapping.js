/**
 * Verify every DB product option/price maps to a Shopify catalog variant.
 * Writes data/variant-mapping-evidence.json — no Storefront checkout claim.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const catalogPath = path.join(__dirname, "..", "data", "shopify-catalog.json");
const outPath = path.join(__dirname, "..", "data", "variant-mapping-evidence.json");

function money(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const byVariantId = new Map();
  const byProductShopifyId = new Map();

  for (const p of catalog.products) {
    byProductShopifyId.set(String(p.shopifyId), p);
    for (const v of p.variants || []) {
      byVariantId.set(String(v.id), {
        productHandle: p.handle,
        productShopifyId: String(p.shopifyId),
        title: v.title,
        price: money(v.price),
        available: v.available !== false,
        option1: v.option1 || null,
        option2: v.option2 || null,
        option3: v.option3 || null,
      });
    }
  }

  const products = await prisma.product.findMany({
    where: { published: true },
    include: { variants: true },
    orderBy: { slug: "asc" },
  });

  const mismatches = [];
  const missingShopifyId = [];
  const priceMismatches = [];
  const orphanDbVariants = [];
  const catalogMissingInDb = [];
  let purchasableOptions = 0;
  let mappedOk = 0;
  const samples = [];

  for (const p of products) {
    const catalogProduct = p.shopifyProductId
      ? byProductShopifyId.get(String(p.shopifyProductId))
      : null;

    for (const v of p.variants) {
      const displayPrice =
        v.priceOverride != null ? money(v.priceOverride) : money(p.basePrice);
      const uiPurchasable = Boolean(
        v.active && v.shopifyVariantId && v.priceOverride != null
      );
      if (uiPurchasable) purchasableOptions++;

      if (!v.shopifyVariantId) {
        missingShopifyId.push({
          productSlug: p.slug,
          variantId: v.id,
          title: v.title,
          displayPrice,
        });
        continue;
      }

      const src = byVariantId.get(String(v.shopifyVariantId));
      if (!src) {
        orphanDbVariants.push({
          productSlug: p.slug,
          shopifyVariantId: v.shopifyVariantId,
          title: v.title,
          displayPrice,
        });
        continue;
      }

      if (money(src.price) !== displayPrice) {
        priceMismatches.push({
          productSlug: p.slug,
          shopifyVariantId: v.shopifyVariantId,
          catalogPrice: src.price,
          displayedPrice: displayPrice,
          variantTitle: v.title,
        });
      } else {
        mappedOk++;
        if (samples.length < 12 && uiPurchasable) {
          samples.push({
            productSlug: p.slug,
            variantTitle: v.title,
            shopifyVariantId: v.shopifyVariantId,
            displayedPrice: displayPrice,
            catalogPrice: src.price,
            option1: v.option1,
            merchandiseGid: `gid://shopify/ProductVariant/${v.shopifyVariantId}`,
            uiPurchasable: true,
          });
        }
      }

      if (
        (v.option1 || null) !== (src.option1 || null) ||
        (v.option2 || null) !== (src.option2 || null) ||
        (v.option3 || null) !== (src.option3 || null)
      ) {
        mismatches.push({
          type: "option_label",
          productSlug: p.slug,
          shopifyVariantId: v.shopifyVariantId,
          db: { option1: v.option1, option2: v.option2, option3: v.option3 },
          catalog: {
            option1: src.option1,
            option2: src.option2,
            option3: src.option3,
          },
        });
      }
    }

    if (catalogProduct) {
      const dbIds = new Set(
        p.variants.map((v) => String(v.shopifyVariantId || "")).filter(Boolean)
      );
      for (const cv of catalogProduct.variants || []) {
        if (!dbIds.has(String(cv.id))) {
          catalogMissingInDb.push({
            handle: catalogProduct.handle,
            shopifyVariantId: String(cv.id),
            title: cv.title,
            price: money(cv.price),
          });
        }
      }
    }
  }

  // Catalog variants with no DB row at all
  const allDbShopifyIds = new Set();
  for (const p of products) {
    for (const v of p.variants) {
      if (v.shopifyVariantId) allDbShopifyIds.add(String(v.shopifyVariantId));
    }
  }
  let catalogVariantsNotInDb = 0;
  for (const [id] of byVariantId) {
    if (!allDbShopifyIds.has(id)) catalogVariantsNotInDb++;
  }

  const report = {
    verifiedAt: new Date().toISOString(),
    source: catalog.source || "data/shopify-catalog.json",
    authority:
      "DB vs preliminary public catalog dump — not a live Storefront purchasability proof",
    totals: {
      catalogProducts: catalog.products.length,
      catalogVariants: byVariantId.size,
      dbPublishedProducts: products.length,
      dbVariants: products.reduce((n, p) => n + p.variants.length, 0),
      purchasableUiOptions: purchasableOptions,
      priceAndIdMappedOk: mappedOk,
      missingShopifyVariantId: missingShopifyId.length,
      orphanDbVariants: orphanDbVariants.length,
      priceMismatches: priceMismatches.length,
      optionLabelMismatches: mismatches.length,
      catalogVariantsMissingInDbSample: catalogMissingInDb.length,
      catalogVariantsNotInDb: catalogVariantsNotInDb,
    },
    samples,
    issues: {
      missingShopifyId: missingShopifyId.slice(0, 50),
      orphanDbVariants: orphanDbVariants.slice(0, 50),
      priceMismatches: priceMismatches.slice(0, 50),
      optionLabelMismatches: mismatches.slice(0, 50),
      catalogMissingInDb: catalogMissingInDb.slice(0, 50),
    },
    checkoutNote:
      "Checkout remains blocked without SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN. Mapping OK ≠ end-to-end Shopify checkout success.",
    pass:
      missingShopifyId.length === 0 &&
      orphanDbVariants.length === 0 &&
      priceMismatches.length === 0 &&
      catalogVariantsNotInDb === 0,
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals, null, 2));
  console.log("pass", report.pass);
  console.log("wrote", outPath);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
