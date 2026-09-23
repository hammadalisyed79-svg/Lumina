import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid collection" }, { status: 400 });

  const slug = slugify(parsed.data.slug || parsed.data.title);
  const exists = await prisma.collection.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const collection = await prisma.collection.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      published: parsed.data.published ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.collection.create",
    entity: "Collection",
    entityId: collection.id,
  });

  return NextResponse.json({ id: collection.id });
}
