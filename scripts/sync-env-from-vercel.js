const fs = require("fs");

function parseEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i)] = v;
  }
  return out;
}

function serializeEnv(obj) {
  return (
    Object.entries(obj)
      .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
      .join("\n") + "\n"
  );
}

const vercel = parseEnv(fs.readFileSync(".env.vercel", "utf8"));
const local = fs.existsSync(".env")
  ? parseEnv(fs.readFileSync(".env", "utf8"))
  : {};

const db = vercel.DATABASE_URL || vercel.POSTGRES_PRISMA_URL;
if (!db) {
  console.error("No DATABASE_URL in .env.vercel");
  process.exit(1);
}

Object.assign(local, {
  DATABASE_URL: db,
  AUTH_URL: "http://localhost:3000",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  IMAGE_PROVIDER: "local",
  AUTH_SECRET:
    local.AUTH_SECRET ||
    vercel.AUTH_SECRET ||
    "lEyGNVnreGr0z+LZcZN+idQ3vG3k6UEm/BH02VtrJxI=",
  ADMIN_EMAIL: local.ADMIN_EMAIL || "admin@luminahub.co.uk",
  ADMIN_PASSWORD: local.ADMIN_PASSWORD || "LuminaAdmin2026!",
  STRIPE_SECRET_KEY: local.STRIPE_SECRET_KEY || "sk_test_placeholder",
  STRIPE_PUBLISHABLE_KEY: local.STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    local.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: local.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
  RESEND_API_KEY: local.RESEND_API_KEY || "re_placeholder",
  EMAIL_FROM: local.EMAIL_FROM || "Lumina Hub <onboarding@resend.dev>",
});

fs.writeFileSync(".env", serializeEnv(local));
console.log("Updated .env to Neon:", new URL(db).hostname);
