import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { SourceProduct } from "./migration-types";
import { normalizeImageUrlKey } from "./image-urls";
import { sleep } from "./http";

const ROOT = path.join(process.cwd());
export const CATALOG_MEDIA = path.join(ROOT, "public", "catalog", "products");

function extFromUrl(url: string): string {
  try {
    const base = path.basename(new URL(url).pathname);
    const m = base.match(/\.([a-z0-9]+)$/i);
    const ext = (m?.[1] || "jpg").toLowerCase();
    if (ext === "heic") return "heic";
    return ext === "jpeg" ? "jpg" : ext;
  } catch {
    return "jpg";
  }
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { "User-Agent": "LuminaHubCatalogueMigration/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

export async function downloadProductImages(
  products: SourceProduct[],
  concurrency = 4
): Promise<{
  downloaded: number;
  skippedExisting: number;
  deduped: number;
  failed: { handle: string; url: string; error: string }[];
}> {
  fs.mkdirSync(CATALOG_MEDIA, { recursive: true });
  const hashIndex = new Map<string, string>(); // contentHash → localPath
  const urlIndex = new Map<string, string>(); // normalized url → localPath
  let downloaded = 0;
  let skippedExisting = 0;
  let deduped = 0;
  const failed: { handle: string; url: string; error: string }[] = [];

  // Flatten jobs
  type Job = {
    product: SourceProduct;
    imageIndex: number;
  };
  const jobs: Job[] = [];
  for (const p of products) {
    p.images.forEach((_, imageIndex) => jobs.push({ product: p, imageIndex }));
  }

  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const idx = cursor++;
      const job = jobs[idx];
      const img = job.product.images[job.imageIndex];
      const urlKey = normalizeImageUrlKey(img.highResSrc || img.src);
      const dir = path.join(CATALOG_MEDIA, job.product.sourceHandle);
      fs.mkdirSync(dir, { recursive: true });
      const ext = extFromUrl(img.highResSrc || img.src);
      const filename = `${String(img.position).padStart(2, "0")}-${img.id}.${ext}`;
      const dest = path.join(dir, filename);
      const localPath = `/catalog/products/${job.product.sourceHandle}/${filename}`;

      if (urlIndex.has(urlKey)) {
        img.localPath = urlIndex.get(urlKey);
        img.downloadStatus = "skipped_dup";
        deduped++;
        continue;
      }

      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        const buf = fs.readFileSync(dest);
        const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
        img.localPath = localPath;
        img.contentHash = hash;
        img.downloadStatus = "exists";
        hashIndex.set(hash, localPath);
        urlIndex.set(urlKey, localPath);
        skippedExisting++;
        continue;
      }

      try {
        await downloadToFile(img.highResSrc || img.src, dest);
        const buf = fs.readFileSync(dest);
        const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
        if (hashIndex.has(hash)) {
          // Identical binary already stored — reuse path, remove duplicate file
          const existing = hashIndex.get(hash)!;
          img.localPath = existing;
          img.contentHash = hash;
          img.downloadStatus = "skipped_dup";
          if (existing !== localPath) {
            try {
              fs.unlinkSync(dest);
            } catch {
              /* ignore */
            }
          }
          deduped++;
        } else {
          img.localPath = localPath;
          img.contentHash = hash;
          img.downloadStatus = "downloaded";
          hashIndex.set(hash, localPath);
          downloaded++;
          if (downloaded % 40 === 0) {
            console.log(`  images downloaded ${downloaded}/${jobs.length}`);
          }
        }
        urlIndex.set(urlKey, img.localPath!);
      } catch (e) {
        img.downloadStatus = "failed";
        img.downloadError = e instanceof Error ? e.message : String(e);
        failed.push({
          handle: job.product.sourceHandle,
          url: img.highResSrc || img.src,
          error: img.downloadError,
        });
      }
      await sleep(80);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  for (const p of products) {
    const ok = p.images.some((i) => i.localPath);
    if (ok) {
      p.migrationStatus =
        p.migrationStatus === "FAILED" ? "FAILED" : "IMAGES_DOWNLOADED";
    } else if (!p.images.length) {
      p.needsReview = true;
      if (!p.reviewReasons.includes("no_images")) p.reviewReasons.push("no_images");
    } else {
      p.needsReview = true;
      if (!p.reviewReasons.includes("image_download_failed")) {
        p.reviewReasons.push("image_download_failed");
      }
    }
  }

  return { downloaded, skippedExisting, deduped, failed };
}
