const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const p = new PrismaClient();

function resolveMediaUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  const disk = path.join("public", url.slice(1).replace(/\//g, path.sep));
  if (fs.existsSync(disk) && fs.statSync(disk).size > 0) return url;
  const base = disk.replace(/\.[^.]+$/, "");
  for (const ext of ["jpg", "jpeg", "png", "webp", "gif"]) {
    const candidate = base + "." + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return "/" + path.relative("public", candidate).replace(/\\/g, "/");
    }
  }
  return null;
}

(async () => {
  // Fix fabric URLs
  const fabrics = await p.fabric.findMany();
  let fabricFixed = 0;
  for (const f of fabrics) {
    const next = resolveMediaUrl(f.imageUrl);
    if (next && next !== f.imageUrl) {
      await p.fabric.update({ where: { id: f.id }, data: { imageUrl: next } });
      fabricFixed++;
      console.log("fabric", f.slug, "->", next.split("/").pop());
    } else if (f.imageUrl && !next) {
      // pick a published fabric product image as swatch
      const prod = await p.product.findFirst({
        where: { published: true, type: "FABRIC" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        skip: fabricFixed % 10,
      });
      const url = prod?.images[0]?.url ? resolveMediaUrl(prod.images[0].url) : null;
      if (url) {
        await p.fabric.update({ where: { id: f.id }, data: { imageUrl: url } });
        fabricFixed++;
        console.log("fabric fallback", f.slug, "->", url.split("/").pop());
      }
    }
  }

  // Fix shape URLs + fill missing from products by shapeKey
  const shapes = await p.shape.findMany({ orderBy: { sortOrder: "asc" } });
  let shapeFixed = 0;
  const homepageFallbacks = {
    drum: "/media/homepage/shape-0.png",
    oval: "/media/homepage/shape-1.png",
    rectangular: "/media/homepage/shape-2.png",
    square: "/media/homepage/shape-3.png",
    empire: "/media/homepage/shape-0.png",
    coolie: "/media/homepage/shape-1.png",
    tiered: "/media/homepage/shape-2.png",
  };

  for (const s of shapes) {
    let next = resolveMediaUrl(s.imageUrl);
    if (!next) {
      const prod = await p.product.findFirst({
        where: { published: true, type: "LAMPSHADE", shapeKey: s.key },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ featured: "desc" }, { bestseller: "desc" }],
      });
      next = prod?.images[0]?.url ? resolveMediaUrl(prod.images[0].url) : null;
    }
    if (!next) next = homepageFallbacks[s.key] || "/media/homepage/shape-0.png";
    if (next !== s.imageUrl) {
      await p.shape.update({ where: { id: s.id }, data: { imageUrl: next } });
      shapeFixed++;
      console.log("shape", s.key, "->", next);
    }
  }

  // Verify
  const shapes2 = await p.shape.findMany({ orderBy: { sortOrder: "asc" } });
  const fabrics2 = await p.fabric.findMany({ where: { active: true } });
  const bad = [];
  for (const s of shapes2) {
    const disk = path.join("public", (s.imageUrl || "").slice(1).replace(/\//g, path.sep));
    if (!s.imageUrl || !fs.existsSync(disk)) bad.push({ type: "shape", key: s.key, url: s.imageUrl });
  }
  for (const f of fabrics2) {
    const disk = path.join("public", (f.imageUrl || "").slice(1).replace(/\//g, path.sep));
    if (!f.imageUrl || !fs.existsSync(disk)) bad.push({ type: "fabric", slug: f.slug, url: f.imageUrl });
  }
  console.log(JSON.stringify({ fabricFixed, shapeFixed, bad }, null, 2));
  await p.$disconnect();
})();
