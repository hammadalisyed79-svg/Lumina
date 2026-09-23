import fs from "fs";
import path from "path";

type Cfg = { model: string; fields: string[]; where?: string; order?: string };

const pages: Record<string, Cfg> = {
  collections: {
    model: "collection",
    fields: ["title", "slug", "published"],
    order: "sortOrder",
  },
  fabrics: { model: "fabric", fields: ["name", "slug", "colour", "priceMod", "active"], order: "sortOrder" },
  sizes: { model: "size", fields: ["name", "slug", "priceMod", "active"], order: "sortOrder" },
  linings: { model: "lining", fields: ["name", "slug", "priceMod", "active"], order: "sortOrder" },
  fittings: { model: "fitting", fields: ["name", "slug", "priceMod", "active"], order: "sortOrder" },
  customers: {
    model: "user",
    fields: ["name", "email", "role", "createdAt"],
    where: 'role: { in: ["CUSTOMER", "TRADE"] }',
    order: "createdAt",
  },
  coupons: { model: "coupon", fields: ["code", "type", "value", "active", "usedCount"], order: "code" },
  shipping: {
    model: "shippingMethod",
    fields: ["name", "calcType", "price", "active"],
    order: "sortOrder",
  },
  trade: {
    model: "tradeApplication",
    fields: ["businessName", "email", "status", "createdAt"],
    order: "createdAt",
  },
  bespoke: {
    model: "bespokeEnquiry",
    fields: ["name", "email", "status", "createdAt"],
    order: "createdAt",
  },
  cms: { model: "cmsPage", fields: ["title", "slug", "published"], order: "createdAt" },
  media: { model: "mediaAsset", fields: ["key", "url", "provider", "createdAt"], order: "createdAt" },
};

for (const [slug, cfg] of Object.entries(pages)) {
  const dir = path.join("src/app/admin", slug);
  fs.mkdirSync(dir, { recursive: true });
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);
  const where = cfg.where ? `where: { ${cfg.where} },` : "";
  const orderDir = cfg.order === "createdAt" || cfg.order === "code" ? "desc" : "asc";
  const orderBy =
    cfg.order === "code"
      ? "orderBy: { code: 'asc' }"
      : `orderBy: { ${cfg.order}: '${orderDir}' }`;

  const headers = cfg.fields.map((f) => `<th className="p-3">${f}</th>`).join("\n              ");
  const cells = cfg.fields
    .map((f) => `<td className="p-3">{String((row as Record<string, unknown>).${f} ?? "")}</td>`)
    .join("\n                ");

  const content = `import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Admin${title}Page() {
  const rows = await prisma.${cfg.model}.findMany({
    ${where}
    ${orderBy},
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">${title}</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              ${headers}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                ${cells}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.tsx"), content);
  console.log("wrote", slug);
}
