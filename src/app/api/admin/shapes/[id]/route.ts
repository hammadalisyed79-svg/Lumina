import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  basePrice: z.number().min(0).optional(),
  priceMod: z.number().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data = { ...parsed.data };
  if (data.key) {
    const key = slugify(data.key);
    const clash = await prisma.shape.findFirst({ where: { key, NOT: { id } } });
    if (clash) return NextResponse.json({ error: "Key already exists" }, { status: 409 });
    data.key = key;
  }

  const shape = await prisma.shape.update({ where: { id }, data });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.shape.update",
    entity: "Shape",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ shape });
}
