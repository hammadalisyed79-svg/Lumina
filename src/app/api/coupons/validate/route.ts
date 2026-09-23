import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { applyCoupon, toNumber } from "@/lib/pricing";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().min(0),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`coupon:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: parsed.data.code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.active) {
    return NextResponse.json({ ok: false, error: "Invalid coupon" }, { status: 400 });
  }
  if (coupon.endsAt && coupon.endsAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Coupon expired" }, { status: 400 });
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ ok: false, error: "Coupon fully redeemed" }, { status: 400 });
  }

  const check = applyCoupon(parsed.data.subtotal, {
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
  });
  if (!check.valid) {
    return NextResponse.json(
      { ok: false, error: check.reason || "Coupon not applicable" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    code: coupon.code,
    discount: check.discount,
    type: coupon.type,
    value: toNumber(coupon.value),
  });
}
