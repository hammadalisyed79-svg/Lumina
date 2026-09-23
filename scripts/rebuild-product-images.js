const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();
const MEDIA_ROOT = path.join(process.cwd(), "public", "media", "products");
const CATALOG_ROOT = path.join(process.cwd(), "public", "catalog", "products");

function listImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f) && !/\.heic$/i.test(f))
    .map((filename) => {
      const m = filename.match(/^(\d+)-(\d+)\.([a-z0-9]+)$/i);
      return {
        filename,
        position: m ? parseInt(m[1], 10) : 999,
        imageId: m ? m[2] : null,
        abs: path.join(dir, filename),
      };
    })
    .sort((a, b) => a.position - b.position || a.filename.localeCompare(b.filename));
}

function hashFile(abs) {
  const buf = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

(async () => {
  const parsed = JSON.parse(fs.readFileSync("migration/luminahub-parsed-products.json", "utf8"));
  const byHandle = new Map(parsed.map((x) => [x.sourceHandle, x]));

  const products = await prisma.product.findMany({
    include: { variants: { select: { sku: true }, take: 1 } },
  });

  let fixed = 0;
  let unchanged = 0;
  let skipped = 0;
  const report = [];

  for (const prod of products) {
    const src = byHandle.get(prod.sourceHandle) || byHandle.get(prod.slug) || byHandle.get(prod.shopifyHandle || "");
    const mediaDir = path.join(MEDIA_ROOT, prod.slug);
    const catalogDir = path.join(CATALOG_ROOT, prod.sourceHandle || prod.slug);

    // Prefer media folder (complete); fall back to catalog
    let files = listImageFiles(mediaDir);
    let urlPrefix = `/media/products/${prod.slug}`;
    if (!files.length) {
      files = listImageFiles(catalogDir);
      urlPrefix = `/catalog/products/${prod.sourceHandle || prod.slug}`;
    }
    if (!files.length) {
      skipped++;
      report.push({ slug: prod.slug, sku: prod.variants[0]?.sku, status: "no_files" });
      continue;
    }

    // Build rows: prefer source order/alt/sourceUrl when imageId matches a disk file
    const byId = new Map(files.filter((f) => f.imageId).map((f) => [f.imageId, f]));
    const used = new Set();
    const rows = [];

    if (src?.images?.length) {
      for (const img of src.images) {
        const id = String(img.id);
        const file = byId.get(id);
        if (!file) continue;
        used.add(file.filename);
        const pos = img.position || file.position;
        rows.push({
          productId: prod.id,
          url: `${urlPrefix}/${file.filename}`,
          alt: img.alt || prod.title,
          sortOrder: pos,
          isPrimary: pos === 1 || rows.length === 0,
          sourceUrl: img.src || img.highResSrc || null,
          width: img.width || null,
          height: img.height || null,
          contentHash: hashFile(file.abs),
        });
      }
    }

    // Any leftover disk files not in source (keep them, ordered)
    for (const file of files) {
      if (used.has(file.filename)) continue;
      const pos = file.position || rows.length + 1;
      rows.push({
        productId: prod.id,
        url: `${urlPrefix}/${file.filename}`,
        alt: prod.title,
        sortOrder: pos,
        isPrimary: rows.length === 0,
        sourceUrl: null,
        width: null,
        height: null,
        contentHash: hashFile(file.abs),
      });
    }

    // Ensure exactly one primary (lowest sortOrder)
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    rows.forEach((r, i) => {
      r.isPrimary = i === 0;
      if (!r.sortOrder) r.sortOrder = i + 1;
    });

    await prisma.productImage.deleteMany({ where: { productId: prod.id } });
    if (rows.length) {
      await prisma.productImage.createMany({ data: rows });
    }
    fixed++;
    report.push({
      slug: prod.slug.slice(0, 70),
      sku: prod.variants[0]?.sku,
      status: "rebuilt",
      images: rows.length,
      primary: rows[0]?.url,
    });
  }

  // Verify
  const after = await prisma.product.findMany({
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: { select: { sku: true }, take: 1 } },
  });
  let ok = 0;
  let bad = 0;
  const badSamples = [];
  for (const prod of after) {
    let foreign = 0;
    for (const img of prod.images) {
      const m = (img.url || "").match(/\/(?:media|catalog)\/products\/([^/]+)\//);
      if (!m) continue;
      if (m[1] !== prod.slug && m[1] !== prod.sourceHandle && m[1] !== prod.shopifyHandle) foreign++;
    }
    if (foreign || !prod.images.length) {
      bad++;
      if (badSamples.length < 10) badSamples.push({ slug: prod.slug, sku: prod.variants[0]?.sku, foreign, count: prod.images.length });
    } else ok++;
  }

  console.log(JSON.stringify({ fixed, unchanged, skipped, verify: { ok, bad, badSamples }, sample: report.slice(0, 5) }, null, 2));
  fs.writeFileSync("data/image-sku-rebuild-report.json", JSON.stringify({ fixed, skipped, report, verify: { ok, bad, badSamples } }, null, 2));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
