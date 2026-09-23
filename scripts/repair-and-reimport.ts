/**
 * Repair products where slug/sourceHandle drifted, then re-apply migration data
 * keyed strictly by sourceHandle === slug.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { importProductsToDatabase } from "../src/lib/import/db-importer";
import type { SourceProduct } from "../src/lib/import/migration-types";
import { MIGRATION_DIR } from "../src/lib/import/migration-report";

const prisma = new PrismaClient();

async function main() {
  // Reset migration identity fields to slug so lookups can't cross-wire
  const all = await prisma.product.findMany({ select: { id: true, slug: true } });
  console.log("Resetting sourceHandle/shopifyHandle to slug for", all.length, "products");
  for (const p of all) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        sourceHandle: p.slug,
        shopifyHandle: p.slug,
      },
    });
  }

  const products = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-parsed-products.json"), "utf8")
  ) as SourceProduct[];
  const discovery = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-discovery-report.json"), "utf8")
  );

  // Patch importer lookup: prefer slug === sourceHandle
  const report = await importProductsToDatabase(
    prisma,
    products,
    discovery.collections.map((c: { handle: string; title: string }) => ({
      handle: c.handle,
      title: c.title,
    }))
  );
  console.log(report);

  // Verify no cross-wire: title must relate to slug keywords loosely
  let mismatches = 0;
  for (const sp of products.slice(0, 30)) {
    const row = await prisma.product.findUnique({ where: { slug: sp.sourceHandle } });
    if (!row) {
      console.warn("missing slug", sp.sourceHandle);
      mismatches++;
      continue;
    }
    if (row.sourceTitle !== sp.originalTitle) {
      console.warn("title mismatch", sp.sourceHandle.slice(0, 40));
      mismatches++;
    }
  }
  console.log("sample mismatches", mismatches);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
