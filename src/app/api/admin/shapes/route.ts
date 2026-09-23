import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).optional(),
  basePrice: z.number().min(0),
  priceMod: z.number().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid shape" }, { status: 400 });

  const key = slugify(parsed.data.key || parsed.data.name);
  const exists = await prisma.shape.findUnique({ where: { key } });
  if (exists) return NextResponse.json({ error: "Key already exists" }, { status: 409 });

  const shape = await prisma.shape.create({
    data: {
      name: parsed.data.name,
      key,
      basePrice: parsed.data.basePrice,
      priceMod: parsed.data.priceMod ?? 0,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
      imageUrl: parsed.data.imageUrl || null,
      description: parsed.data.description || null,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.shape.create",
    entity: "Shape",
    entityId: shape.id,
  });

  return NextResponse.json({ id: shape.id });
}
