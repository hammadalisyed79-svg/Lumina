import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(2),
  county: z.string().optional(),
  postcode: z.string().min(3),
  phone: z.string().optional(),
  isDefault: z.union([z.literal("true"), z.literal("on"), z.boolean()]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  const isDefault = parsed.data.isDefault === true || parsed.data.isDefault === "true" || parsed.data.isDefault === "on";
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: session.user.id,
      fullName: parsed.data.fullName,
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      county: parsed.data.county,
      postcode: parsed.data.postcode,
      phone: parsed.data.phone,
      isDefault,
    },
  });

  return NextResponse.json({ ok: true });
}
