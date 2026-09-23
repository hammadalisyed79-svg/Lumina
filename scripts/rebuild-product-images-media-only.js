const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const p = new PrismaClient();

function listImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .map((filename) => {
        const m = filename.match(/^(\d+)-(\d+)\.([a-z0-9]+)$/i);
        return { filename, position: m ? parseInt(m[1], 10) : 999, imageId: m ? m[2] : null, abs: path.join(dir, filename) };
      })
      .sort((a, b) => a.position - b.position);
  } catch (e) {
    console.error("readdir fail", dir, e.message);
    return [];
  }
}

(async () => {
  const parsed = JSON.parse(fs.readFileSync("migration/luminahub-parsed-products.json", "utf8"));
  const byHandle = new Map(parsed.map((x) => [x.sourceHandle, x]));
  const products = await p.product.findMany({ include: { variants: { take: 1, select: { sku: true } } } });

  let rebuilt = 0, empty = 0;
  for (const prod of products) {
    const mediaDir = path.join(process.cwd(), "public", "media", "products", prod.slug);
    const files = listImageFiles(mediaDir);
    if (!files.length) {
      empty++;
      console.log("EMPTY MEDIA", prod.slug, prod.variants[0]?.sku);
      continue;
    }
    const urlPrefix = `/media/products/${prod.slug}`;
    const src = byHandle.get(prod.sourceHandle) || byHandle.get(prod.slug);
    const byId = new Map(files.filter((f) => f.imageId).map((f) => [f.imageId, f]));
    const used = new Set();
    const rows = [];

    if (src?.images) {
      for (const img of src.images) {
        const file = byId.get(String(img.id));
        if (!file) continue;
        used.add(file.filename);
        rows.push({
          productId: prod.id,
          url: `${urlPrefix}/${file.filename}`,
          alt: img.alt || prod.title,
          sortOrder: Number(img.position) || file.position,
          isPrimary: false,
          sourceUrl: img.src || null,
          width: img.width || null,
          height: img.height || null,
          contentHash: crypto.createHash("sha256").update(fs.readFileSync(file.abs)).digest("hex").slice(0, 16),
        });
      }
    }
    for (const file of files) {
      if (used.has(file.filename)) continue;
      rows.push({
        productId: prod.id,
        url: `${urlPrefix}/${file.filename}`,
        alt: prod.title,
        sortOrder: file.position,
        isPrimary: false,
        sourceUrl: null,
        contentHash: crypto.createHash("sha256").update(fs.readFileSync(file.abs)).digest("hex").slice(0, 16),
      });
    }
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    rows.forEach((r, i) => { r.isPrimary = i === 0; });

    await p.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: prod.id } });
      if (rows.length) await tx.productImage.createMany({ data: rows });
    });
    rebuilt++;
  }

  // Verify strictly
  const after = await p.product.findMany({ include: { images: true, variants: { take: 1, select: { sku: true } } } });
  let ok = 0, bad = 0;
  const issues = [];
  for (const prod of after) {
    if (!prod.images.length) {
      bad++; issues.push({ sku: prod.variants[0]?.sku, slug: prod.slug, issue: "no_images" }); continue;
    }
    let badRow = 0;
    for (const img of prod.images) {
      const m = (img.url || "").match(/^\/media\/products\/([^/]+)\//);
      if (!m || m[1] !== prod.slug) badRow++;
      else {
        const disk = path.join("public", img.url.slice(1).replace(/\//g, path.sep));
        if (!fs.existsSync(disk)) badRow++;
      }
    }
    if (badRow) { bad++; issues.push({ sku: prod.variants[0]?.sku, slug: prod.slug.slice(0,50), badRow, urls: prod.images.map(i=>i.url).slice(0,3) }); }
    else ok++;
  }
  console.log(JSON.stringify({ rebuilt, empty, ok, bad, issues }, null, 2));
  await p.$disconnect();
})();
