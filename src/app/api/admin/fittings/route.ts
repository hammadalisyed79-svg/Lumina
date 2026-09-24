import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  compatibility: z.string().optional(),
  priceMod: z.number().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid fitting" }, { status: 400 });

  const slug = slugify(parsed.data.slug || parsed.data.name);
  const exists = await prisma.fitting.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const fitting = await prisma.fitting.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      compatibility: parsed.data.compatibility || null,
      priceMod: parsed.data.priceMod ?? 0,
      active: parsed.data.active ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.fitting.create",
    entity: "Fitting",
    entityId: fitting.id,
  });

  return NextResponse.json({ id: fitting.id });
}
