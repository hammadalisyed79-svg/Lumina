import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  shapeId: z.string().nullable().optional(),
  diameterCm: z.number().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  widthCm: z.number().nullable().optional(),
  depthCm: z.number().nullable().optional(),
  displayUnit: z.string().optional(),
  priceMod: z.number().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid size" }, { status: 400 });

  const slug = slugify(parsed.data.slug || parsed.data.name);
  const exists = await prisma.size.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  if (parsed.data.shapeId) {
    const shape = await prisma.shape.findUnique({ where: { id: parsed.data.shapeId } });
    if (!shape) return NextResponse.json({ error: "Unknown shape" }, { status: 400 });
  }

  const size = await prisma.size.create({
    data: {
      name: parsed.data.name,
      slug,
      shapeId: parsed.data.shapeId || null,
      diameterCm: parsed.data.diameterCm ?? null,
      heightCm: parsed.data.heightCm ?? null,
      widthCm: parsed.data.widthCm ?? null,
      depthCm: parsed.data.depthCm ?? null,
      displayUnit: parsed.data.displayUnit || "cm",
      priceMod: parsed.data.priceMod ?? 0,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.size.create",
    entity: "Size",
    entityId: size.id,
  });

  return NextResponse.json({ id: size.id });
}
