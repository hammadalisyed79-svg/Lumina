import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  sizeIds: z.array(z.string()),
  fabricIds: z.array(z.string()),
  liningIds: z.array(z.string()),
  fittingIds: z.array(z.string()),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const [sizes, fabrics, linings, fittings] = await Promise.all([
    prisma.shapeSize.findMany({ where: { shapeId: id } }),
    prisma.shapeFabric.findMany({ where: { shapeId: id } }),
    prisma.shapeLining.findMany({ where: { shapeId: id } }),
    prisma.shapeFitting.findMany({ where: { shapeId: id } }),
  ]);

  return NextResponse.json({
    sizeIds: sizes.map((r) => r.sizeId),
    fabricIds: fabrics.map((r) => r.fabricId),
    liningIds: linings.map((r) => r.liningId),
    fittingIds: fittings.map((r) => r.fittingId),
  });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const shape = await prisma.shape.findUnique({ where: { id } });
  if (!shape) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { sizeIds, fabricIds, liningIds, fittingIds } = parsed.data;

  await prisma.$transaction([
    prisma.shapeSize.deleteMany({ where: { shapeId: id } }),
    prisma.shapeFabric.deleteMany({ where: { shapeId: id } }),
    prisma.shapeLining.deleteMany({ where: { shapeId: id } }),
    prisma.shapeFitting.deleteMany({ where: { shapeId: id } }),
    prisma.shapeSize.createMany({
      data: sizeIds.map((sizeId) => ({
        shapeId: id,
        sizeId,
        needsReview: false,
        source: "admin",
      })),
      skipDuplicates: true,
    }),
    prisma.shapeFabric.createMany({
      data: fabricIds.map((fabricId) => ({
        shapeId: id,
        fabricId,
        needsReview: false,
        source: "admin",
      })),
      skipDuplicates: true,
    }),
    prisma.shapeLining.createMany({
      data: liningIds.map((liningId) => ({
        shapeId: id,
        liningId,
        needsReview: false,
        source: "admin",
      })),
      skipDuplicates: true,
    }),
    prisma.shapeFitting.createMany({
      data: fittingIds.map((fittingId) => ({
        shapeId: id,
        fittingId,
        needsReview: false,
        source: "admin",
      })),
      skipDuplicates: true,
    }),
  ]);

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.shape.eligibility",
    entity: "Shape",
    entityId: id,
    meta: {
      sizes: sizeIds.length,
      fabrics: fabricIds.length,
      linings: liningIds.length,
      fittings: fittingIds.length,
    },
  });

  return NextResponse.json({ ok: true });
}
