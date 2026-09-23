import fs from "fs";
import path from "path";
import type {
  DiscoveryReport,
  ImageAuditReport,
  ImportReport,
  SourceProduct,
} from "./migration-types";

const ROOT = path.join(process.cwd());
export const MIGRATION_DIR = path.join(ROOT, "migration");

export function ensureMigrationDir() {
  fs.mkdirSync(MIGRATION_DIR, { recursive: true });
}

export function writeJson(name: string, data: unknown) {
  ensureMigrationDir();
  const p = path.join(MIGRATION_DIR, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  return p;
}

export function buildImageAudit(products: SourceProduct[]): ImageAuditReport {
  const zero: string[] = [];
  const one: string[] = [];
  let multi = 0;
  let discovered = 0;
  let downloaded = 0;
  let skipped = 0;
  let deduped = 0;
  const failed: ImageAuditReport["failedDownloads"] = [];

  for (const p of products) {
    discovered += p.images.length;
    const withLocal = p.images.filter((i) => i.localPath).length;
    if (p.images.length === 0) zero.push(p.sourceHandle);
    else if (p.images.length === 1) one.push(p.sourceHandle);
    else multi++;

    for (const img of p.images) {
      if (img.downloadStatus === "downloaded") downloaded++;
      if (img.downloadStatus === "exists") skipped++;
      if (img.downloadStatus === "skipped_dup") deduped++;
      if (img.downloadStatus === "failed") {
        failed.push({
          handle: p.sourceHandle,
          url: img.highResSrc || img.src,
          error: img.downloadError || "unknown",
        });
      }
    }
    if (p.images.length > 0 && withLocal === 0) {
      // already in failed via downloads
    }
  }

  return {
    completedAt: new Date().toISOString(),
    productsWithZeroImages: zero,
    productsWithOneImage: one,
    productsWithMultipleImages: multi,
    imagesDiscovered: discovered,
    imagesDownloaded: downloaded,
    imagesSkippedExisting: skipped,
    imagesDeduped: deduped,
    failedDownloads: failed,
  };
}

export function writeProductsCsv(products: SourceProduct[]) {
  ensureMigrationDir();
  const header = [
    "handle",
    "displayName",
    "originalTitle",
    "category",
    "shapeKey",
    "basePrice",
    "imageCount",
    "variantCount",
    "collections",
    "sourceAvailability",
    "needsReview",
    "migrationStatus",
  ];
  const lines = [header.join(",")];
  for (const p of products) {
    const row = [
      p.sourceHandle,
      csv(p.displayName),
      csv(p.originalTitle),
      p.category,
      p.shapeKey || "",
      p.basePrice,
      String(p.images.length),
      String(p.variants.length),
      csv(p.collectionHandles.join("|")),
      p.sourceAvailability,
      p.needsReview ? "yes" : "no",
      p.migrationStatus,
    ];
    lines.push(row.join(","));
  }
  const p = path.join(MIGRATION_DIR, "luminahub-products.csv");
  fs.writeFileSync(p, lines.join("\n"));
  return p;
}

function csv(s: string) {
  const v = String(s || "").replace(/"/g, '""');
  return `"${v}"`;
}

export function writeDiscoveryReport(report: DiscoveryReport) {
  return writeJson("luminahub-discovery-report.json", report);
}

export function writeImportReport(report: ImportReport) {
  return writeJson("luminahub-import-report.json", report);
}

export function writeParsedProducts(products: SourceProduct[]) {
  return writeJson("luminahub-parsed-products.json", products);
}
