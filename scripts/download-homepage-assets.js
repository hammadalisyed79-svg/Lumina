const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
      })
      .on("error", reject);
  });
}

(async () => {
  const outDir = path.join("public", "media", "homepage");
  fs.mkdirSync(outDir, { recursive: true });

  const home = await fetch("https://www.luminahub.co.uk/");
  const html = home.body.toString("utf8");
  fs.writeFileSync("scripts/_home.html", html);

  const urls = [
    ...html.matchAll(
      /(?:https?:)?\/\/www\.luminahub\.co\.uk\/cdn\/shop\/files\/([^"'?\s>]+\.(?:jpg|jpeg|png|webp))/gi
    ),
  ].map((m) => `https://www.luminahub.co.uk/cdn/shop/files/${m[1]}`);

  const unique = [...new Set(urls)];
  console.log("found images", unique.length);
  unique.slice(0, 20).forEach((u, i) => console.log(i, u));

  // Hero lifestyle is typically a large banner - prefer files with living-room cues or largest early banner assets
  const heroCandidates = unique.filter(
    (u) =>
      /hero|banner|lifestyle|living|sofa|room|welcome|IMG-|WhatsApp|download/i.test(u) ||
      true
  );

  // Download first substantial image that looks like a lifestyle photo (skip tiny logos)
  let saved = null;
  for (const u of unique.slice(0, 15)) {
    try {
      const r = await fetch(u.includes("?") ? u : `${u}?v=1`);
      if (r.status !== 200) continue;
      if (r.body.length < 80_000) continue; // skip logos/icons
      const ext = path.extname(new URL(u).pathname) || ".jpg";
      const dest = path.join(outDir, `hero-lifestyle${ext}`);
      fs.writeFileSync(dest, r.body);
      console.log("saved hero", dest, r.body.length);
      saved = dest;
      break;
    } catch (e) {
      console.log("skip", u, e.message);
    }
  }

  // Also grab category shape tiles (common on homepage)
  let shapeIdx = 0;
  for (const u of unique) {
    if (!/download_-_2026-04-10/i.test(u)) continue;
    const r = await fetch(u.includes("?") ? u : `${u}?v=1`);
    if (r.status !== 200 || r.body.length < 5_000) continue;
    const dest = path.join(outDir, `shape-${shapeIdx}${path.extname(new URL(u).pathname) || ".png"}`);
    fs.writeFileSync(dest, r.body);
    console.log("saved shape", dest, r.body.length);
    shapeIdx++;
    if (shapeIdx >= 4) break;
  }

  console.log(JSON.stringify({ saved, shapeCount: shapeIdx }));
})();
