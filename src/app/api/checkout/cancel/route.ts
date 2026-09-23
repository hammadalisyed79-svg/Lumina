import { NextResponse } from "next/server";
import { z } from "zod";
import {
  markOrderCancelledOnce,
  markOrderPaymentFailedOnce,
} from "@/lib/orders/payment";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

const schema = z.object({
  orderNumber: z.string().min(3),
  outcome: z.enum(["cancelled", "failed"]).default("cancelled"),
  reason: z.string().optional(),
});

/**
 * Customer return from hosted checkout without paying.
 * Only updates unpaid/pending orders — never clears a PAID order.
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`checkout-cancel:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.outcome === "failed") {
    const result = await markOrderPaymentFailedOnce({
      orderNumber: parsed.data.orderNumber,
      reason: parsed.data.reason || "Payment failed / declined at hosted checkout",
    });
    return NextResponse.json({
      ok: true,
      outcome: "failed",
      updated: result.updated,
      reason: "reason" in result ? result.reason : undefined,
    });
  }

  const result = await markOrderCancelledOnce({
    orderNumber: parsed.data.orderNumber,
    reason: parsed.data.reason || "Customer cancelled hosted checkout",
  });
  return NextResponse.json({
    ok: true,
    outcome: "cancelled",
    updated: result.updated,
    reason: "reason" in result ? result.reason : undefined,
  });
}
