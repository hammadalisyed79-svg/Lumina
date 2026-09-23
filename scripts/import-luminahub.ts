/**
 * Complete Lumina Hub catalogue migration from https://www.luminahub.co.uk/
 *
 * Phases:
 *   discover  — crawl collections + pagination, write discovery report
 *   parse     — fetch every unique product JSON
 *   images    — download to public/catalog/products/{handle}/
 *   import    — upsert into PostgreSQL via Prisma
 *   all       — discover → parse → images → import
 *
 * Usage:
 *   npx tsx scripts/import-luminahub.ts discover
 *   npx tsx scripts/import-luminahub.ts all
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { crawlCollectionProducts, discoverCollections } from "../src/lib/import/collection-parser";
import { downloadProductImages } from "../src/lib/import/image-downloader";
import { importProductsToDatabase } from "../src/lib/import/db-importer";
import {
  buildImageAudit,
  MIGRATION_DIR,
  writeDiscoveryReport,
  writeImportReport,
  writeParsedProducts,
  writeProductsCsv,
} from "../src/lib/import/migration-report";
import { fetchProductByHandle, mapPool } from "../src/lib/import/product-parser";
import type { DiscoveryReport, ImportReport, SourceProduct } from "../src/lib/import/migration-types";
import { BASE } from "../src/lib/import/http";

const prisma = new PrismaClient();
const PHASE = (process.argv[2] || "all").toLowerCase();

async function phaseDiscover(): Promise<DiscoveryReport> {
  console.log("\n=== DISCOVER collections ===");
  const cols = await discoverCollections();
  console.log(`Found ${cols.length} collections`);

  let pages = 0;
  let links = 0;
  const collections = [];
  const handleToCollections = new Map<string, string[]>();

  for (const c of cols) {
    console.log(`Crawl ${c.handle} (reported ${c.productsCount ?? "?"})`);
    const crawled = await crawlCollectionProducts(c.handle);
    pages += crawled.pagesCrawled;
    links += crawled.productHandles.length;
    collections.push({
      ...c,
      ...crawled,
    });
    for (const h of crawled.productHandles) {
      const list = handleToCollections.get(h) || [];
      if (!list.includes(c.handle)) list.push(c.handle);
      handleToCollections.set(h, list);
    }
  }

  const uniqueHandles = [...handleToCollections.keys()].sort();
  const report: DiscoveryReport = {
    crawledAt: new Date().toISOString(),
    sourceWebsite: BASE,
    collectionsDiscovered: collections.length,
    collectionPagesCrawled: pages,
    productLinksFound: links,
    uniqueProducts: uniqueHandles.length,
    duplicateUrlsRemoved: links - uniqueHandles.length,
    collections,
    uniqueHandles,
  };

  // Persist membership map for parse phase
  fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "handle-collections.json"),
    JSON.stringify(Object.fromEntries(handleToCollections), null, 2)
  );
  writeDiscoveryReport(report);
  console.log(
    JSON.stringify(
      {
        collections: report.collectionsDiscovered,
        pages: report.collectionPagesCrawled,
        links: report.productLinksFound,
        unique: report.uniqueProducts,
        dupesRemoved: report.duplicateUrlsRemoved,
      },
      null,
      2
    )
  );
  return report;
}

async function phaseParse(discovery?: DiscoveryReport): Promise<SourceProduct[]> {
  console.log("\n=== PARSE products ===");
  const disc =
    discovery ||
    (JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-discovery-report.json"), "utf8")
    ) as DiscoveryReport);
  const membership = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "handle-collections.json"), "utf8")
  ) as Record<string, string[]>;

  const failedPages: { url: string; error: string }[] = [];
  const products = await mapPool(disc.uniqueHandles, 3, async (handle, idx) => {
    try {
      const p = await fetchProductByHandle(handle, membership[handle] || []);
      if ((idx + 1) % 20 === 0) console.log(`  parsed ${idx + 1}/${disc.uniqueHandles.length}`);
      return p;
    } catch (e) {
      failedPages.push({
        url: `${BASE}/products/${handle}`,
        error: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  });

  const ok = products.filter(Boolean) as SourceProduct[];
  writeParsedProducts(ok);
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "parse-failures.json"),
    JSON.stringify(failedPages, null, 2)
  );
  console.log(`Parsed ${ok.length}; failed ${failedPages.length}`);
  return ok;
}

async function phaseImages(products: SourceProduct[]) {
  console.log("\n=== DOWNLOAD images → public/catalog/products ===");
  const result = await downloadProductImages(products, 4);
  writeParsedProducts(products);
  const audit = buildImageAudit(products);
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "luminahub-image-audit.json"),
    JSON.stringify(audit, null, 2)
  );
  console.log(JSON.stringify(result, null, 2));
  return { result, audit };
}

async function phaseImport(products: SourceProduct[], discovery: DiscoveryReport) {
  console.log("\n=== IMPORT into database ===");
  const db = await importProductsToDatabase(
    prisma,
    products,
    discovery.collections.map((c) => ({ handle: c.handle, title: c.title }))
  );

  const byCategory: Record<string, number> = {};
  const byCollection: Record<string, number> = {};
  for (const p of products) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    for (const h of p.collectionHandles) {
      byCollection[h] = (byCollection[h] || 0) + 1;
    }
  }

  const audit = buildImageAudit(products);
  const report: ImportReport = {
    completedAt: new Date().toISOString(),
    discovery,
    productsParsed: products.length,
    productsFailed: discovery.uniqueProducts - products.length,
    images: audit,
    productsImported: db.upsertedProducts,
    productsNeedingReview: products.filter((p) => p.needsReview).length,
    failedPages: JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "parse-failures.json"), "utf8")
    ),
    byCategory,
    byCollection,
    database: db,
  };
  writeImportReport(report);
  writeProductsCsv(products);
  console.log(JSON.stringify({ database: db, needingReview: report.productsNeedingReview }, null, 2));
  return report;
}

async function main() {
  fs.mkdirSync(MIGRATION_DIR, { recursive: true });

  if (PHASE === "discover") {
    await phaseDiscover();
    return;
  }

  if (PHASE === "parse") {
    await phaseParse();
    return;
  }

  if (PHASE === "images") {
    const products = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-parsed-products.json"), "utf8")
    ) as SourceProduct[];
    await phaseImages(products);
    return;
  }

  if (PHASE === "import") {
    const discovery = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-discovery-report.json"), "utf8")
    ) as DiscoveryReport;
    const products = JSON.parse(
      fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-parsed-products.json"), "utf8")
    ) as SourceProduct[];
    await phaseImport(products, discovery);
    return;
  }

  if (PHASE === "all") {
    const discovery = await phaseDiscover();
    const products = await phaseParse(discovery);
    await phaseImages(products);
    const report = await phaseImport(products, discovery);
    console.log("\n=== DONE ===");
    console.log(
      JSON.stringify(
        {
          collections: discovery.collectionsDiscovered,
          uniqueProducts: discovery.uniqueProducts,
          imported: report.productsImported,
          imagesDiscovered: report.images.imagesDiscovered,
          imagesDownloaded: report.images.imagesDownloaded + report.images.imagesSkippedExisting,
          zeroImages: report.images.productsWithZeroImages.length,
          needsReview: report.productsNeedingReview,
          report: "migration/luminahub-import-report.json",
          media: "public/catalog/products/",
        },
        null,
        2
      )
    );
    return;
  }

  console.error("Unknown phase. Use: discover | parse | images | import | all");
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
