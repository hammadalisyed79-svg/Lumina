const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const envFile = process.argv[2] || ".env.vercel";
const raw = fs.readFileSync(path.resolve(envFile), "utf8");
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing in", envFile);
  process.exit(1);
}

console.log("Migrating against Neon…");
execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
console.log("Seeding…");
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
console.log("Done.");
