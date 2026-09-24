import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { toNumber } from "@/lib/pricing";
import { catalogImageUrl } from "@/lib/studio/images";
import { derivePatternScale, deriveUseTypes } from "@/lib/configurator/fabric-meta";

export async function GET() {
  const [fabrics, sizes, linings, fittings, shapes] = await Promise.all([
    prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.size.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { shape: { select: { key: true } } },
    }),
    prisma.lining.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fitting.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.shape.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({
    fabrics: fabrics.map((f) => {
      const photo = catalogImageUrl(f.imageUrl, f.swatchUrl);
      const swatch = catalogImageUrl(f.swatchUrl, f.imageUrl);
      return {
        id: f.id,
        slug: f.slug,
        name: f.name,
        priceMod: toNumber(f.priceMod),
        imageUrl: photo,
        swatchUrl: swatch || photo,
        material: f.material,
        colour: f.colour,
        pattern: f.pattern,
        description: f.description,
        patternScale: derivePatternScale(f.material, f.pattern, f.name),
      };
    }),
    sizes: sizes.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      priceMod: toNumber(s.priceMod),
      diameterCm: s.diameterCm ? toNumber(s.diameterCm) : null,
      heightCm: s.heightCm ? toNumber(s.heightCm) : null,
      widthCm: s.widthCm ? toNumber(s.widthCm) : null,
      depthCm: s.depthCm ? toNumber(s.depthCm) : null,
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
      useTypes: deriveUseTypes(f.slug, f.compatibility),
    })),
    shapes: shapes.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      basePrice: toNumber(s.basePrice),
      priceMod: toNumber(s.priceMod),
      imageUrl: catalogImageUrl(s.imageUrl),
      description: s.description,
    })),
  });
}
