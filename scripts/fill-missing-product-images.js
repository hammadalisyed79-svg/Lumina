const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const p = new PrismaClient();

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "LuminaHub/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf;
}

(async () => {
  const parsed = JSON.parse(fs.readFileSync("migration/luminahub-parsed-products.json", "utf8"));
  const byHandle = new Map(parsed.map((x) => [x.sourceHandle, x]));
  const products = await p.product.findMany({
    include: { images: true, variants: { take: 1, select: { sku: true } } },
  });

  let downloaded = 0, failed = 0, rebuilt = 0;
  const failures = [];

  for (const prod of products) {
    const src = byHandle.get(prod.sourceHandle) || byHandle.get(prod.slug);
    if (!src?.images?.length) continue;
    const dir = path.join("public/media/products", prod.slug);
    fs.mkdirSync(dir, { recursive: true });

    let changed = false;
    for (const img of src.images) {
      const id = String(img.id);
      const existing = fs.readdirSync(dir).find((f) => f.includes(`-${id}.`) && !/\.heic$/i.test(f));
      if (existing) continue;
      // try download
      const srcUrl = img.highResSrc || img.src;
      if (!srcUrl) continue;
      let ext = "jpg";
      try {
        const u = new URL(srcUrl);
        const m = u.pathname.match(/\.([a-z0-9]+)$/i);
        if (m) ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
        if (ext === "heic") ext = "jpg"; // request convertible
      } catch {}
      const filename = `${String(img.position).padStart(2, "0")}-${id}.${ext}`;
      const dest = path.join(dir, filename);
      try {
        let url = srcUrl;
        if (ext === "jpg" || ext === "webp" || ext === "png") {
          try {
            const u = new URL(srcUrl);
            u.searchParams.set("width", "2000");
            if (/\.heic$/i.test(u.pathname)) {
              u.pathname = u.pathname.replace(/\.heic$/i, ".jpg");
            }
            url = u.toString();
          } catch {}
        }
        await download(url, dest);
        // if heic magic, try sharp convert later - delete if heic
        const buf = fs.readFileSync(dest);
        if (buf.slice(4, 8).toString() === "ftyp") {
          fs.unlinkSync(dest);
          failed++;
          failures.push({ slug: prod.slug.slice(0, 40), id, reason: "heic" });
          continue;
        }
        downloaded++;
        changed = true;
      } catch (e) {
        failed++;
        failures.push({ slug: prod.slug.slice(0, 40), id, reason: e.message });
      }
    }

    // Rebuild DB rows from disk browser files always when source count > db or changed
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f));
    if (changed || files.length !== prod.images.filter((i) => !/\.heic$/i.test(i.url)).length) {
      const byId = new Map();
      for (const f of files) {
        const m = f.match(/^(\d+)-(\d+)\./);
        if (m) byId.set(m[2], { filename: f, position: +m[1] });
      }
      const rows = [];
      const used = new Set();
      for (const img of src.images) {
        const file = byId.get(String(img.id));
        if (!file) continue;
        used.add(file.filename);
        rows.push({
          productId: prod.id,
          url: `/media/products/${prod.slug}/${file.filename}`,
          alt: img.alt || prod.title,
          sortOrder: img.position || file.position,
          isPrimary: false,
          sourceUrl: img.src || null,
        });
      }
      for (const f of files) {
        if (used.has(f)) continue;
        const m = f.match(/^(\d+)-/);
        rows.push({
          productId: prod.id,
          url: `/media/products/${prod.slug}/${f}`,
          alt: prod.title,
          sortOrder: m ? +m[1] : 999,
          isPrimary: false,
          sourceUrl: null,
        });
      }
      rows.sort((a, b) => a.sortOrder - b.sortOrder);
      rows.forEach((r, i) => (r.isPrimary = i === 0));
      await p.productImage.deleteMany({ where: { productId: prod.id } });
      if (rows.length) await p.productImage.createMany({ data: rows });
      rebuilt++;
    }
  }

  // Final stats
  const after = await p.product.findMany({ include: { images: true } });
  let catalog = 0, heic = 0, noWeb = 0, total = 0;
  for (const prod of after) {
    total += prod.images.length;
    const web = prod.images.filter((i) => i.url && !/\.heic$/i.test(i.url) && i.url.startsWith("/media/"));
    if (!web.length) noWeb++;
    catalog += prod.images.filter((i) => i.url.startsWith("/catalog/")).length;
    heic += prod.images.filter((i) => /\.heic$/i.test(i.url)).length;
  }
  console.log(JSON.stringify({ downloaded, failed, rebuilt, failures: failures.slice(0, 20), totals: { products: after.length, images: total, catalog, heic, noWeb } }, null, 2));
  await p.$disconnect();
})();
