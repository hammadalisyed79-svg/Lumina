import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  menuId: z.string(),
  label: z.string().min(1),
  url: z.string().min(1),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const item = await prisma.navigationItem.create({
    data: {
      menuId: parsed.data.menuId,
      label: parsed.data.label,
      url: parsed.data.url,
      sortOrder: parsed.data.sortOrder ?? 0,
      enabled: parsed.data.enabled ?? true,
    },
  });
  return NextResponse.json({ item });
}
