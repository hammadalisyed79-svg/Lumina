import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/pricing";
import { calculateShadePrice } from "@/lib/configurator/pricing";
import type { ConfigCatalog, UseType } from "@/lib/configurator/types";

const schema = z.object({
  shapeKey: z.string().nullable().optional(),
  sizeId: z.string().nullable().optional(),
  fabricId: z.string().nullable().optional(),
  liningId: z.string().nullable().optional(),
  fittingId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(20).optional(),
});

async function loadCatalog(): Promise<ConfigCatalog> {
  const [fabrics, sizes, linings, fittings, shapes] = await Promise.all([
    prisma.fabric.findMany({ where: { active: true } }),
    prisma.size.findMany({
      where: { active: true },
      include: { shape: { select: { key: true } } },
    }),
    prisma.lining.findMany({ where: { active: true } }),
    prisma.fitting.findMany({ where: { active: true } }),
    prisma.shape.findMany({ where: { active: true } }),
  ]);

  return {
    shapes: shapes.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      basePrice: toNumber(s.basePrice),
      priceMod: toNumber(s.priceMod),
      useTypes: (s.useTypes || []) as UseType[],
    })),
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
      eligibleShapeKeys: [],
    })),
    fabrics: fabrics.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      patternScale: f.patternScale,
      patternOffsetX: f.patternOffsetX,
      patternOffsetY: f.patternOffsetY,
      patternRotation: f.patternRotation,
      repeatMode: f.repeatMode,
      usableAsTexture: f.usableAsTexture,
      eligibleShapeKeys: [],
    })),
    linings: linings.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      priceMod: toNumber(l.priceMod),
      eligibleShapeKeys: [],
    })),
    fittings: fittings.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      priceMod: toNumber(f.priceMod),
      useTypes: (f.useTypes || []) as UseType[],
      eligibleShapeKeys: [],
    })),
  };
}

/** Server-trusted shade price from selected option IDs. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid configuration" }, { status: 400 });
  }

  const catalog = await loadCatalog();
  const price = calculateShadePrice(catalog, {
    shapeKey: parsed.data.shapeKey ?? null,
    sizeId: parsed.data.sizeId ?? null,
    fabricId: parsed.data.fabricId ?? null,
    liningId: parsed.data.liningId ?? null,
    fittingId: parsed.data.fittingId ?? null,
    quantity: parsed.data.quantity ?? 1,
  });

  return NextResponse.json(price);
}
