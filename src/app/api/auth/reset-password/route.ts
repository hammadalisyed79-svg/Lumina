import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(16),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`reset:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: `reset:${email}`,
        token: parsed.data.token,
      },
    },
  });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: `reset:${email}`,
        token: parsed.data.token,
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "auth.password_reset",
    entity: "User",
    entityId: user.id,
    ip,
  });

  return NextResponse.json({ ok: true });
}
