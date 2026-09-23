import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/security/audit";
import { clientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  role: z.nativeEnum(Role),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (id === session.user.id && parsed.data.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot demote your own SUPER_ADMIN account" },
      { status: 400 }
    );
  }

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "user.role_changed",
    entity: "User",
    entityId: id,
    meta: { before: before.role, after: updated.role },
    ip: clientIp(req.headers),
  });

  return NextResponse.json({ ok: true, role: updated.role });
}
