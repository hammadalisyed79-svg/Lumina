import fs from "fs";
import path from "path";
import { fetchProductByHandle } from "../src/lib/import/product-parser";
import { writeParsedProducts, MIGRATION_DIR } from "../src/lib/import/migration-report";
import type { SourceProduct } from "../src/lib/import/migration-types";
import { sleep } from "../src/lib/import/http";

async function main() {
  const failures = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "parse-failures.json"), "utf8")
  ) as { url: string; error: string }[];
  const membership = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "handle-collections.json"), "utf8")
  ) as Record<string, string[]>;
  const existing = JSON.parse(
    fs.readFileSync(path.join(MIGRATION_DIR, "luminahub-parsed-products.json"), "utf8")
  ) as SourceProduct[];

  const byHandle = new Map(existing.map((p) => [p.sourceHandle, p]));
  const stillFailed: { url: string; error: string }[] = [];

  console.log(`Retrying ${failures.length} failed products with slow concurrency…`);
  for (const f of failures) {
    const handle = f.url.split("/products/")[1];
    if (!handle) continue;
    if (byHandle.has(handle)) continue;
    try {
      await sleep(800);
      const p = await fetchProductByHandle(handle, membership[handle] || []);
      byHandle.set(handle, p);
      console.log("  recovered", handle.slice(0, 60));
    } catch (e) {
      stillFailed.push({
        url: f.url,
        error: e instanceof Error ? e.message : String(e),
      });
      console.warn("  still fail", handle.slice(0, 50), e);
      await sleep(2000);
    }
  }

  const products = [...byHandle.values()];
  writeParsedProducts(products);
  fs.writeFileSync(
    path.join(MIGRATION_DIR, "parse-failures.json"),
    JSON.stringify(stillFailed, null, 2)
  );
  console.log(`Total parsed now: ${products.length}; still failed: ${stillFailed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
