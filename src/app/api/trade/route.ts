import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`trade:${ip}`, 3, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid application" }, { status: 400 });

  await prisma.tradeApplication.create({
    data: {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      userId: session?.user?.id,
    },
  });

  return NextResponse.json({ ok: true });
}
