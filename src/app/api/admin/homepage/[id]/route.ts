import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaHref: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const section = await prisma.homepageSection.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.homepage.update",
    entity: "HomepageSection",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ section });
}
