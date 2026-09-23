import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { toNumber } from "@/lib/pricing";

export async function GET() {
  const [fabrics, sizes, linings, fittings, shapes] = await Promise.all([
    prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.size.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
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
    })),
    sizes: sizes.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      priceMod: toNumber(s.priceMod),
      diameterCm: s.diameterCm ? toNumber(s.diameterCm) : null,
      heightCm: s.heightCm ? toNumber(s.heightCm) : null,
    })),
    linings: linings.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      priceMod: toNumber(l.priceMod),
    })),
    fittings: fittings.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      description: f.description,
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
