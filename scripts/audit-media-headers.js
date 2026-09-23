/**
 * Quick media health: find .webp files that are not actually WebP (JPEG/PNG mislabeled).
 * Run: node scripts/audit-media-headers.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "public", "media");
const bad = [];
let checked = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.webp$/i.test(name)) {
      checked++;
      const buf = Buffer.alloc(12);
      const fd = fs.openSync(full, "r");
      fs.readSync(fd, buf, 0, 12, 0);
      fs.closeSync(fd);
      const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50;
      if (!isWebp) {
        bad.push({
          file: path.relative(root, full).replace(/\\/g, "/"),
          kind: isJpeg ? "jpeg" : isPng ? "png" : "unknown",
        });
      }
    }
  }
}

if (!fs.existsSync(root)) {
  console.log("No public/media");
  process.exit(0);
}
walk(root);
console.log(JSON.stringify({ checked, mislabeled: bad.length, samples: bad.slice(0, 25) }, null, 2));
