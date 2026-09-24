import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { toNumber } from "@/lib/pricing";

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
    fabrics: fabrics.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      imageUrl: f.imageUrl,
      swatchUrl: f.swatchUrl,
      material: f.material,
      colour: f.colour,
      pattern: f.pattern,
      description: f.description,
    })),
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
      swatchUrl: l.swatchUrl,
      description: l.description,
    })),
    fittings: fittings.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      description: f.description,
      imageUrl: f.imageUrl,
      compatibility: f.compatibility,
    })),
    shapes: shapes.map((s) => ({
      key: s.key,
      name: s.name,
      basePrice: toNumber(s.basePrice),
      imageUrl: s.imageUrl,
      description: s.description,
    })),
  });
}
