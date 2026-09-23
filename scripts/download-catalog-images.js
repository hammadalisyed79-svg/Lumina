/**
 * Download all catalog images into public/media/products/{handle}/
 * Prefer non-HEIC. Record status in data/image-migration-report.json
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "shopify-catalog.json"), "utf8")
);
const MEDIA = path.join(ROOT, "public", "media", "products");
const REPORT = path.join(ROOT, "data", "image-migration-report.json");

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const base = u.pathname.split("/").pop() || "image";
    const m = base.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "jpg";
  } catch {
    return "jpg";
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      { headers: { "User-Agent": "LuminaHubMigration/1.0" } },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      }
    );
    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function mapPool(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

async function main() {
  fs.mkdirSync(MEDIA, { recursive: true });
  const jobs = [];
  for (const p of catalog.products) {
    const dir = path.join(MEDIA, p.handle);
    fs.mkdirSync(dir, { recursive: true });
    for (const img of p.images) {
      const ext = extFromUrl(img.src);
      const filename = `${String(img.position).padStart(2, "0")}-${img.id}.${ext}`;
      const dest = path.join(dir, filename);
      const localPath = `/media/products/${p.handle}/${filename}`;
      jobs.push({
        productHandle: p.handle,
        shopifyImageId: img.id,
        sourceUrl: img.src,
        dest,
        localPath,
        ext,
        isHeic: ext === "heic",
        position: img.position,
      });
    }
  }

  console.log("Downloading", jobs.length, "images…");
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  await mapPool(jobs, 8, async (job) => {
    if (fs.existsSync(job.dest) && fs.statSync(job.dest).size > 0) {
      skipped++;
      job.status = "exists";
      return job;
    }
    if (job.isHeic) {
      // Still download HEIC for archival; mark for conversion review
    }
    try {
      await download(job.sourceUrl, job.dest);
      job.status = "downloaded";
      ok++;
      if (ok % 25 === 0) console.log("  downloaded", ok, "/", jobs.length);
    } catch (e) {
      job.status = "failed";
      job.error = e.message;
      failed++;
      failures.push({ handle: job.productHandle, url: job.sourceUrl, error: e.message });
    }
    return job;
  });

  // Attach local paths back onto catalog product images
  const byKey = new Map(
    jobs.map((j) => [`${j.productHandle}:${j.shopifyImageId}`, j])
  );
  for (const p of catalog.products) {
    for (const img of p.images) {
      const j = byKey.get(`${p.handle}:${img.id}`);
      if (j && (j.status === "downloaded" || j.status === "exists")) {
        img.localPath = j.localPath;
        img.migrationStatus = j.status;
      } else {
        img.migrationStatus = j?.status || "missing";
        img.migrationError = j?.error;
      }
    }
  }
  fs.writeFileSync(
    path.join(ROOT, "data", "shopify-catalog.json"),
    JSON.stringify(catalog, null, 2)
  );

  const report = {
    completedAt: new Date().toISOString(),
    totals: { jobs: jobs.length, downloaded: ok, skippedExisting: skipped, failed },
    heicCount: jobs.filter((j) => j.isHeic).length,
    failures: failures.slice(0, 100),
    note: "HEIC files downloaded for archive but browsers need converted JPG/WebP for display.",
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals, null, 2));
  console.log("HEIC count", report.heicCount);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
