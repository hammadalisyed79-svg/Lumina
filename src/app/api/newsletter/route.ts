import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

function studioInbox() {
  return (
    process.env.NEWSLETTER_TO ||
    process.env.CONTACT_TO ||
    process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ||
    SITE.email
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source || "footer";

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, source },
    update: {},
  });

  const to = studioInbox();
  const mail = await sendEmail({
    to,
    subject: `Newsletter signup: ${email}`,
    html: `<p>New newsletter subscriber</p><p><strong>${email}</strong></p><p>Source: ${source}</p><p style="color:#888;font-size:12px">Subscriber id: ${subscriber.id}</p>`,
  });

  return NextResponse.json({
    ok: true,
    destination: {
      database: "newsletterSubscriber",
      subscriberId: subscriber.id,
      emailTo: to,
      emailDelivered: !mail.skipped,
      emailSkipped: Boolean(mail.skipped),
      reason: mail.skipped
        ? "RESEND_API_KEY not configured — signup stored in DB only"
        : undefined,
    },
  });
}
