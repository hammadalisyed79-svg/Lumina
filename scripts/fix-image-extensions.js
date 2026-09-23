const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const p = new PrismaClient();

function detectExt(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.toString("ascii", 0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length >= 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return "gif";
  if (buf.length >= 12 && buf.slice(4, 8).toString() === "ftyp") return "heic";
  return null;
}

(async () => {
  const root = path.join("public", "media", "products");
  let renamed = 0, skipped = 0, errors = [];
  const renames = []; // { fromUrl, toUrl }

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(jpe?g|png|webp|gif|heic)$/i.test(ent.name)) {
        const buf = fs.readFileSync(full);
        const real = detectExt(buf);
        if (!real || real === "heic") { skipped++; continue; }
        const curExt = path.extname(ent.name).slice(1).toLowerCase().replace("jpeg", "jpg");
        if (curExt === real) continue;
        const newName = ent.name.replace(/\.[^.]+$/, `.${real}`);
        const dest = path.join(dir, newName);
        if (fs.existsSync(dest)) {
          // already have correct file — remove wrong-ext duplicate if different
          if (path.resolve(full) !== path.resolve(dest)) {
            try { fs.unlinkSync(full); } catch {}
          }
          const relDir = path.relative("public", dir).replace(/\\/g, "/");
          renames.push({
            fromUrl: `/${relDir}/${ent.name}`.replace(/\\/g, "/"),
            toUrl: `/${relDir}/${newName}`.replace(/\\/g, "/"),
          });
          renamed++;
          continue;
        }
        fs.renameSync(full, dest);
        const relDir = path.relative("public", dir).replace(/\\/g, "/");
        renames.push({
          fromUrl: `/${relDir}/${ent.name}`.replace(/\\/g, "/"),
          toUrl: `/${relDir}/${newName}`.replace(/\\/g, "/"),
        });
        renamed++;
      }
    }
  }
  walk(root);

  // Update DB urls
  let dbUpdated = 0;
  for (const r of renames) {
    const res = await p.productImage.updateMany({
      where: { url: r.fromUrl },
      data: { url: r.toUrl },
    });
    dbUpdated += res.count;
    // also catalog twin urls if any
    const catFrom = r.fromUrl.replace("/media/", "/catalog/");
    const catTo = r.toUrl.replace("/media/", "/catalog/");
    if (catFrom !== r.fromUrl) {
      await p.productImage.updateMany({ where: { url: catFrom }, data: { url: r.toUrl } });
    }
  }

  // Also fix any DB urls whose file was renamed but update missed (case/path)
  const images = await p.productImage.findMany();
  let repaired = 0;
  for (const img of images) {
    const disk = path.join("public", img.url.slice(1).replace(/\//g, path.sep));
    if (fs.existsSync(disk)) continue;
    // try alternate extensions
    const base = disk.replace(/\.[^.]+$/, "");
    let found = null;
    for (const ext of ["jpg", "jpeg", "png", "webp", "gif"]) {
      if (fs.existsSync(base + "." + ext)) { found = base + "." + ext; break; }
    }
    if (found) {
      const url = "/" + path.relative("public", found).replace(/\\/g, "/");
      await p.productImage.update({ where: { id: img.id }, data: { url } });
      repaired++;
    } else {
      errors.push(img.url);
    }
  }

  console.log(JSON.stringify({
    renamedFiles: renamed,
    dbUpdated,
    repaired,
    missingAfter: errors.length,
    missingSamples: errors.slice(0, 10),
    renameSamples: renames.slice(0, 10),
  }, null, 2));
  await p.$disconnect();
})();
