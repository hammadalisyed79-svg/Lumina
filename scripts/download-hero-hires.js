const fs = require("fs");
const path = require("path");
const https = require("https");

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      })
      .on("error", reject);
  });
}

(async () => {
  const outDir = path.join("public", "media", "homepage");
  const targets = [
    {
      url: "https://www.luminahub.co.uk/cdn/shop/files/Gemini_Generated_Image_97e61d97e61d97e6.png",
      dest: "hero-lifestyle.png",
    },
    {
      url: "https://www.luminahub.co.uk/cdn/shop/files/Gemini_Generated_Image_ec8ptec8ptec8pte_2048x2048.png",
      dest: "story-craft.png",
    },
  ];
  for (const t of targets) {
    const r = await fetch(t.url);
    console.log(t.dest, r.status, r.body.length);
    if (r.status === 200 && r.body.length > 50_000) {
      fs.writeFileSync(path.join(outDir, t.dest), r.body);
    }
  }
})();
