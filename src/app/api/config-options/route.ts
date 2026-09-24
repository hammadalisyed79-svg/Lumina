import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { toNumber } from "@/lib/pricing";
import { catalogImageUrl } from "@/lib/studio/images";
import type { UseType } from "@/lib/configurator/types";

function asUseTypes(arr: string[]): UseType[] {
  return arr.filter((u): u is UseType =>
    u === "table" || u === "floor" || u === "ceiling"
  );
}

export async function GET() {
  const [fabrics, sizes, linings, fittings, shapes, shapeSizes, shapeFabrics, shapeLinings, shapeFittings] =
    await Promise.all([
      prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.size.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { shape: { select: { key: true } } },
      }),
      prisma.lining.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.fitting.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.shape.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.shapeSize.findMany(),
      prisma.shapeFabric.findMany(),
      prisma.shapeLining.findMany(),
      prisma.shapeFitting.findMany(),
    ]);

  const shapeKeyById = new Map(shapes.map((s) => [s.id, s.key]));

  const sizesByShape = new Map<string, string[]>();
  for (const row of shapeSizes) {
    const key = shapeKeyById.get(row.shapeId);
    if (!key) continue;
    if (!sizesByShape.has(row.sizeId)) sizesByShape.set(row.sizeId, []);
    sizesByShape.get(row.sizeId)!.push(key);
  }

  const fabricsByShape = new Map<string, string[]>();
  for (const row of shapeFabrics) {
    const key = shapeKeyById.get(row.shapeId);
    if (!key) continue;
    if (!fabricsByShape.has(row.fabricId)) fabricsByShape.set(row.fabricId, []);
    fabricsByShape.get(row.fabricId)!.push(key);
  }

  const liningsByShape = new Map<string, string[]>();
  for (const row of shapeLinings) {
    const key = shapeKeyById.get(row.shapeId);
    if (!key) continue;
    if (!liningsByShape.has(row.liningId)) liningsByShape.set(row.liningId, []);
    liningsByShape.get(row.liningId)!.push(key);
  }

  const fittingsByShape = new Map<string, string[]>();
  for (const row of shapeFittings) {
    const key = shapeKeyById.get(row.shapeId);
    if (!key) continue;
    if (!fittingsByShape.has(row.fittingId)) fittingsByShape.set(row.fittingId, []);
    fittingsByShape.get(row.fittingId)!.push(key);
  }

  return NextResponse.json({
    fabrics: fabrics.map((f) => {
      const swatch = catalogImageUrl(f.swatchUrl, f.imageUrl);
      const texture = catalogImageUrl(f.textureImage, f.usableAsTexture ? swatch : null);
      return {
        id: f.id,
        slug: f.slug,
        name: f.name,
        priceMod: toNumber(f.priceMod),
        imageUrl: catalogImageUrl(f.imageUrl, f.swatchUrl),
        swatchUrl: swatch,
        textureImage: texture,
        material: f.material,
        colour: f.colour,
        pattern: f.pattern,
        description: f.description,
        patternScale: f.patternScale,
        patternOffsetX: f.patternOffsetX,
        patternOffsetY: f.patternOffsetY,
        patternRotation: f.patternRotation,
        repeatMode: f.repeatMode,
        usableAsTexture: f.usableAsTexture,
        eligibleShapeKeys: fabricsByShape.get(f.id) || [],
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
      topDiameterCm: s.topDiameterCm ? toNumber(s.topDiameterCm) : null,
      bottomDiameterCm: s.bottomDiameterCm ? toNumber(s.bottomDiameterCm) : null,
      shapeKey: s.shape?.key ?? null,
      eligibleShapeKeys: sizesByShape.get(s.id) || [],
    })),
    linings: linings.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      priceMod: toNumber(l.priceMod),
      colour: l.colour,
      swatchUrl: catalogImageUrl(l.swatchUrl),
      description: l.description,
      rendererHex: l.rendererHex,
      reflectivityHint: l.reflectivityHint,
      eligibleShapeKeys: liningsByShape.get(l.id) || [],
    })),
    fittings: fittings.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      description: f.description,
      imageUrl: catalogImageUrl(f.imageUrl),
      compatibility: f.compatibility,
      useTypes: asUseTypes(f.useTypes || []),
      eligibleShapeKeys: fittingsByShape.get(f.id) || [],
    })),
    shapes: shapes.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      basePrice: toNumber(s.basePrice),
      priceMod: toNumber(s.priceMod),
      imageUrl: catalogImageUrl(s.imageUrl),
      description: s.description,
      useTypes: asUseTypes(s.useTypes || []),
    })),
  });
}
