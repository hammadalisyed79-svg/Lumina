import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes = [
    "",
    "/shop/lampshades",
    "/design-your-shade",
    "/size-guide",
    "/trade",
    "/bespoke",
    "/about",
    "/contact",
    "/search",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...collections.map((c) => ({
      url: `${base}/shop/${c.slug}`,
      lastModified: c.updatedAt,
    })),
  ];
}
