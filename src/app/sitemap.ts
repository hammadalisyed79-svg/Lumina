import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticRoutes = [
    "",
    "/shop/lampshades",
    "/shop/fabrics",
    "/shop/cushions",
    "/shop/kits",
    "/design-your-shade",
    "/size-guide",
    "/craft",
    "/trade",
    "/bespoke",
    "/about",
    "/contact",
    "/faq",
    "/care",
    "/shipping",
    "/refunds",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path.startsWith("/shop") ? 0.9 : 0.7,
  }));

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...collections.map((c) => ({
        url: `${base}/shop/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
