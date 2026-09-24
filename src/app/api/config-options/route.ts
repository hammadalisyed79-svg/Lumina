import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { toNumber } from "@/lib/pricing";
import { catalogImageUrl } from "@/lib/studio/images";

export async function GET() {
  const [fabrics, sizes, linings, fittings, shapes, catalog] = await Promise.all([
    prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.size.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { shape: { select: { key: true } } },
    }),
    prisma.lining.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fitting.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.shape.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: {
        published: true,
        type: "LAMPSHADE",
        shapeKey: { not: null },
      },
      select: {
        shapeKey: true,
        title: true,
        colourTags: true,
        patternTags: true,
        material: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
      take: 240,
    }),
  ]);

  const previewCatalog: Record<
    string,
    Array<{
      imageUrl: string;
      title: string;
      colourTags: string[];
      patternTags: string[];
      material: string | null;
    }>
  > = {};

  for (const p of catalog) {
    const key = p.shapeKey;
    if (!key) continue;
    const imageUrl = catalogImageUrl(p.images[0]?.url);
    if (!imageUrl) continue;
    if (!previewCatalog[key]) previewCatalog[key] = [];
    if (previewCatalog[key].length >= 24) continue;
    previewCatalog[key].push({
      imageUrl,
      title: p.title,
      colourTags: p.colourTags,
      patternTags: p.patternTags,
      material: p.material,
    });
  }

  return NextResponse.json({
    fabrics: fabrics.map((f) => {
      const photo = catalogImageUrl(f.imageUrl, f.swatchUrl);
      return {
        id: f.id,
        slug: f.slug,
        name: f.name,
        priceMod: toNumber(f.priceMod),
        imageUrl: photo,
        swatchUrl: photo,
        material: f.material,
        colour: f.colour,
        pattern: f.pattern,
        description: f.description,
      };
    }),
    sizes: sizes.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      priceMod: toNumber(s.priceMod),
      diameterCm: s.diameterCm ? toNumber(s.diameterCm) : null,
      heightCm: s.heightCm ? toNumber(s.heightCm) : null,
      shapeKey: s.shape?.key ?? null,
    })),
    linings: linings.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      priceMod: toNumber(l.priceMod),
      colour: l.colour,
      swatchUrl: catalogImageUrl(l.swatchUrl),
      description: l.description,
    })),
    fittings: fittings.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      description: f.description,
      imageUrl: catalogImageUrl(f.imageUrl),
      compatibility: f.compatibility,
    })),
    shapes: shapes.map((s) => ({
      key: s.key,
      name: s.name,
      basePrice: toNumber(s.basePrice),
      imageUrl: catalogImageUrl(s.imageUrl),
      description: s.description,
    })),
    previewCatalog,
  });
}
