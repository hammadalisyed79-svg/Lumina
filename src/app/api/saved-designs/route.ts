import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

const schema = z.object({
  name: z.string().optional(),
  shapeKey: z.string(),
  fabricSlug: z.string(),
  sizeSlug: z.string(),
  liningSlug: z.string(),
  fittingSlug: z.string(),
  unitPrice: z.number(),
  guestKey: z.string().optional(),
  previewUrl: z.string().optional(),
  useType: z.enum(["table", "floor", "ceiling"]).optional(),
  personalisation: z.string().max(200).optional(),
  quantity: z.number().int().min(1).max(20).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid design" }, { status: 400 });
  }

  const [shape, fabric, size, lining, fitting] = await Promise.all([
    prisma.shape.findUnique({ where: { key: parsed.data.shapeKey } }),
    prisma.fabric.findUnique({ where: { slug: parsed.data.fabricSlug } }),
    prisma.size.findUnique({ where: { slug: parsed.data.sizeSlug } }),
    prisma.lining.findUnique({ where: { slug: parsed.data.liningSlug } }),
    prisma.fitting.findUnique({ where: { slug: parsed.data.fittingSlug } }),
  ]);

  if (!shape || !fabric || !size || !lining || !fitting) {
    return NextResponse.json({ error: "Unknown options" }, { status: 400 });
  }

  const guestKey = session?.user?.id ? null : parsed.data.guestKey || nanoid();

  const design = await prisma.savedDesign.create({
    data: {
      userId: session?.user?.id,
      guestKey: guestKey || undefined,
      name: parsed.data.name,
      shapeId: shape.id,
      fabricId: fabric.id,
      sizeId: size.id,
      liningId: lining.id,
      fittingId: fitting.id,
      unitPrice: parsed.data.unitPrice,
      previewUrl: parsed.data.previewUrl || undefined,
      configJson: {
        shapeKey: shape.key,
        shapeName: shape.name,
        fabricSlug: fabric.slug,
        fabricName: fabric.name,
        sizeSlug: size.slug,
        sizeName: size.name,
        liningSlug: lining.slug,
        liningName: lining.name,
        fittingSlug: fitting.slug,
        fittingName: fitting.name,
        unitPrice: parsed.data.unitPrice,
        useType: parsed.data.useType || null,
        personalisation: parsed.data.personalisation || "",
        quantity: parsed.data.quantity || 1,
      },
    },
  });

  return NextResponse.json({
    id: design.id,
    guestKey,
    signedIn: Boolean(session?.user?.id),
  });
}

/** Public reload of a saved design by id (share link). No private user fields. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const design = await prisma.savedDesign.findUnique({
    where: { id },
    include: {
      shape: { select: { key: true, name: true, active: true } },
      fabric: { select: { id: true, slug: true, name: true, active: true } },
      size: { select: { id: true, slug: true, name: true, active: true } },
      lining: { select: { id: true, slug: true, name: true, active: true } },
      fitting: { select: { id: true, slug: true, name: true, active: true } },
    },
  });

  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const cfg = (design.configJson || {}) as Record<string, unknown>;
  const inactive = [
    design.shape && !design.shape.active ? "shape" : null,
    design.fabric && !design.fabric.active ? "fabric" : null,
    design.size && !design.size.active ? "size" : null,
    design.lining && !design.lining.active ? "lining" : null,
    design.fitting && !design.fitting.active ? "fitting" : null,
  ].filter(Boolean);

  return NextResponse.json({
    id: design.id,
    name: design.name,
    unitPrice: Number(design.unitPrice),
    previewUrl: design.previewUrl,
    inactive,
    selection: {
      useType: typeof cfg.useType === "string" ? cfg.useType : null,
      shapeKey: design.shape?.key || (typeof cfg.shapeKey === "string" ? cfg.shapeKey : null),
      fabricId: design.fabric?.id || null,
      fabricSlug: design.fabric?.slug || null,
      sizeId: design.size?.id || null,
      sizeSlug: design.size?.slug || null,
      liningId: design.lining?.id || null,
      liningSlug: design.lining?.slug || null,
      fittingId: design.fitting?.id || null,
      fittingSlug: design.fitting?.slug || null,
      personalisation: typeof cfg.personalisation === "string" ? cfg.personalisation : "",
      quantity: typeof cfg.quantity === "number" ? cfg.quantity : 1,
    },
  });
}
