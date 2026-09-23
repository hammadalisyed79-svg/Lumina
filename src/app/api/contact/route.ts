import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { SITE } from "@/lib/site";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

function studioInbox() {
  return (
    process.env.CONTACT_TO ||
    process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ||
    SITE.email
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  const enquiry = await prisma.contactEnquiry.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: "Contact form",
      message: parsed.data.message,
      status: "NEW",
    },
  });

  const to = studioInbox();
  const mail = await sendEmail({
    to,
    subject: `Contact from ${parsed.data.name}`,
    html: `<p><strong>${parsed.data.name}</strong> &lt;${parsed.data.email}&gt;</p><p>${parsed.data.message.replace(/</g, "&lt;")}</p><p style="color:#888;font-size:12px">Enquiry id: ${enquiry.id}</p>`,
  });

  return NextResponse.json({
    ok: true,
    destination: {
      database: "contactEnquiry",
      enquiryId: enquiry.id,
      emailTo: to,
      emailDelivered: !mail.skipped,
      emailSkipped: Boolean(mail.skipped),
      reason: mail.skipped
        ? "RESEND_API_KEY not configured — message stored in DB only"
        : undefined,
    },
  });
}
