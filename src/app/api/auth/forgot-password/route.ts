import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok to avoid email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
  await prisma.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${base.replace(/\/$/, "")}/account/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Reset your Lumina Hub password",
    html: `<p>Reset your password using this link (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  await writeAuditLog({
    userId: user.id,
    action: "auth.forgot_password",
    entity: "User",
    entityId: user.id,
    ip,
  });

  return NextResponse.json({ ok: true });
}
