import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
});

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.siteSetting.upsert({
    where: { key: "seo_default" },
    create: { key: "seo_default", value: parsed.data },
    update: { value: parsed.data },
  });

  return NextResponse.json({ ok: true });
}
