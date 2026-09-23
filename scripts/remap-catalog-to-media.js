const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const p = new PrismaClient();

(async () => {
  const images = await p.productImage.findMany();
  let remapped = 0, heicFixed = 0, missingMedia = 0;
  const untrackedMedia = [];

  for (const img of images) {
    let url = img.url;
    let changed = false;

    // Prefer media path
    if (url.startsWith("/catalog/")) {
      const mediaUrl = url.replace("/catalog/", "/media/");
      const mediaDisk = path.join("public", mediaUrl.slice(1).replace(/\//g, path.sep));
      const catalogDisk = path.join("public", url.slice(1).replace(/\//g, path.sep));
      if (!fs.existsSync(mediaDisk) && fs.existsSync(catalogDisk)) {
        fs.mkdirSync(path.dirname(mediaDisk), { recursive: true });
        fs.copyFileSync(catalogDisk, mediaDisk);
      }
      if (fs.existsSync(mediaDisk)) {
        url = mediaUrl;
        changed = true;
        remapped++;
      } else {
        missingMedia++;
      }
    }

    // HEIC -> JPG sibling if present
    if (/\.heic$/i.test(url)) {
      const jpgUrl = url.replace(/\.heic$/i, ".jpg");
      const jpgDisk = path.join("public", jpgUrl.slice(1).replace(/\//g, path.sep));
      if (fs.existsSync(jpgDisk)) {
        url = jpgUrl;
        changed = true;
        heicFixed++;
      }
    }

    if (changed) {
      await p.productImage.update({ where: { id: img.id }, data: { url } });
    }
  }

  // Also rebuild any product that still has fewer browser images than media folder
  const products = await p.product.findMany({ include: { images: true } });
  let rebuilt = 0;
  for (const prod of products) {
    const dir = path.join("public/media/products", prod.slug);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f));
    const dbWeb = prod.images.filter((i) => !/\.heic$/i.test(i.url)).length;
    const allMedia = prod.images.every((i) => i.url.startsWith("/media/products/" + prod.slug + "/"));
    if (files.length && (dbWeb < files.length || !allMedia || !prod.images.length)) {
      // full rebuild from media folder
      const rows = files
        .map((filename) => {
          const m = filename.match(/^(\d+)-(\d+)\./);
          return {
            productId: prod.id,
            url: `/media/products/${prod.slug}/${filename}`,
            alt: prod.title,
            sortOrder: m ? parseInt(m[1], 10) : 999,
            isPrimary: false,
            sourceUrl: null,
          };
        })
        .sort((a, b) => a.sortOrder - b.sortOrder);
      rows.forEach((r, i) => (r.isPrimary = i === 0));
      await p.productImage.deleteMany({ where: { productId: prod.id } });
      await p.productImage.createMany({ data: rows });
      rebuilt++;
    }
  }

  // Verify
  const after = await p.productImage.findMany();
  const catalogLeft = after.filter((i) => i.url.startsWith("/catalog/")).length;
  const heicLeft = after.filter((i) => /\.heic$/i.test(i.url)).length;
  const products2 = await p.product.findMany({ include: { images: { orderBy: { sortOrder: "asc" } }, variants: { take: 1, select: { sku: true } } } });
  let noWeb = 0, primary404risk = 0;
  for (const prod of products2) {
    const web = prod.images.filter((i) => i.url && !/\.heic$/i.test(i.url));
    if (!web.length) noWeb++;
    else {
      const disk = path.join("public", web[0].url.slice(1).replace(/\//g, path.sep));
      if (!fs.existsSync(disk)) primary404risk++;
      if (!web[0].url.startsWith("/media/")) primary404risk++;
    }
  }

  // Which media files referenced by DB are not in git?
  let notInGit = 0;
  const notInGitSamples = [];
  for (const img of after) {
    if (!img.url.startsWith("/media/")) continue;
    const rel = img.url.replace(/^\//, "");
    try {
      execSync(`git ls-files --error-unmatch "${rel}"`, { stdio: "ignore" });
    } catch {
      notInGit++;
      if (notInGitSamples.length < 15) notInGitSamples.push(rel);
    }
  }

  console.log(JSON.stringify({ remapped, heicFixed, missingMedia, rebuilt, catalogLeft, heicLeft, noWeb, primary404risk, notInGit, notInGitSamples }, null, 2));
  await p.$disconnect();
})();
