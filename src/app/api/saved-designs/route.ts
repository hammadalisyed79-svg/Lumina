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
      },
    },
  });

  return NextResponse.json({
    id: design.id,
    guestKey,
    signedIn: Boolean(session?.user?.id),
  });
}
