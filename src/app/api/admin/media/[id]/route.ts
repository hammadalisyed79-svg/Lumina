import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  folder: z.string().nullable().optional(),
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

  const data: { alt?: string | null; caption?: string | null; folder?: string | null } = {};
  if (parsed.data.alt !== undefined) data.alt = parsed.data.alt;
  if (parsed.data.caption !== undefined) data.caption = parsed.data.caption;
  if (parsed.data.folder !== undefined) data.folder = parsed.data.folder;

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.mediaAsset.update({ where: { id }, data });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.media.update",
    entity: "MediaAsset",
    entityId: id,
    meta: data,
  });

  return NextResponse.json({ ok: true });
}
