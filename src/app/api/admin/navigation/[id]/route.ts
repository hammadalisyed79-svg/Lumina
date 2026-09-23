import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

const schema = z.object({
  label: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
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

  const item = await prisma.navigationItem.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ item });
}
