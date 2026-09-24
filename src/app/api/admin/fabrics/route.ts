import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  internalCode: z.string().optional(),
  description: z.string().optional(),
  colour: z.string().optional(),
  material: z.string().optional(),
  pattern: z.string().optional(),
  imageUrl: z.string().optional(),
  swatchUrl: z.string().optional(),
  priceMod: z.number().optional(),
  stockQty: z.number().int().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid fabric" }, { status: 400 });

  const slug = slugify(parsed.data.slug || parsed.data.name);
  const exists = await prisma.fabric.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const fabric = await prisma.fabric.create({
    data: {
      name: parsed.data.name,
      slug,
      internalCode: parsed.data.internalCode || null,
      description: parsed.data.description || null,
      colour: parsed.data.colour || null,
      material: parsed.data.material || null,
      pattern: parsed.data.pattern || null,
      imageUrl: parsed.data.imageUrl || null,
      swatchUrl: parsed.data.swatchUrl || null,
      priceMod: parsed.data.priceMod ?? 0,
      stockQty: parsed.data.stockQty ?? null,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.fabric.create",
    entity: "Fabric",
    entityId: fabric.id,
  });

  return NextResponse.json({ id: fabric.id });
}
