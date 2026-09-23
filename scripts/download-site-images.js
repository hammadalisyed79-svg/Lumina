const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "media", "site");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "LuminaHubMigration/1.0" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "LuminaHubMigration/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", (e) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(e);
      });
  });
}

function extractUrls(html) {
  const urls = new Set();
  const re = /(?:https?:)?\/\/cdn\.shopify\.com\/[^"'\\s>]+/gi;
  let m;
  while ((m = re.exec(html))) {
    let u = m[0];
    if (u.startsWith("//")) u = "https:" + u;
    u = u.replace(/&amp;/g, "&");
    if (/\.(jpe?g|png|webp|gif)/i.test(u)) urls.add(u);
  }
  return [...urls];
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const pages = [
    "https://www.luminahub.co.uk/",
    "https://www.luminahub.co.uk/collections/all",
  ];
  const all = new Set();
  for (const page of pages) {
    console.log("scan", page);
    const html = await get(page);
    for (const u of extractUrls(html)) all.add(u);
  }

  const list = [...all];
  fs.writeFileSync(
    path.join(ROOT, "data", "luminahub-co-uk-site-image-urls.json"),
    JSON.stringify(list, null, 2)
  );
  console.log("unique site images", list.length);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (let i = 0; i < list.length; i++) {
    const url = list[i];
    const base = path.basename(new URL(url).pathname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(OUT, `${String(i + 1).padStart(3, "0")}-${base}`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      skip++;
      continue;
    }
    try {
      await download(url, dest);
      ok++;
      if (ok % 10 === 0) console.log("  downloaded", ok);
    } catch (e) {
      fail++;
      console.warn("fail", e.message, url.slice(0, 80));
    }
  }
  console.log(JSON.stringify({ downloaded: ok, skipped: skip, failed: fail, dir: "public/media/site" }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
