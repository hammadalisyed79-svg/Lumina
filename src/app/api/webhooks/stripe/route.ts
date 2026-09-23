import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { orderConfirmationHtml, sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { markOrderPaidOnce } from "@/lib/orders/payment";
import Stripe from "stripe";

export const runtime = "nodejs";

async function redeemCouponForPaidOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, couponCode: true, userId: true },
  });
  if (!order?.couponCode) return;

  const coupon = await prisma.coupon.findUnique({
    where: { code: order.couponCode },
  });
  if (!coupon) return;

  try {
    await prisma.couponRedemption.create({
      data: {
        couponId: coupon.id,
        orderId: order.id,
        userId: order.userId,
      },
    });
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  } catch {
    // Unique [couponId, orderId] — already redeemed for this order
  }
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe()!;
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret || secret.includes("placeholder")) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Process BEFORE recording the event so a mid-flight failure can retry.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      const result = await markOrderPaidOnce({
        orderId,
        eventMessage: "Payment confirmed via Stripe",
        stripePaymentIntent: paymentIntent,
        meta: { stripeSessionId: session.id, eventId: event.id },
      });

      if (result.updated) {
        await redeemCouponForPaidOrder(orderId);

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (order) {
          const itemsHtml = order.items
            .map(
              (i) =>
                `<p>${i.quantity}× ${i.title} — ${formatMoney(toNumber(i.lineTotal))}${
                  i.configJson
                    ? `<br/><small>${JSON.stringify(i.configJson)}</small>`
                    : ""
                }</p>`
            )
            .join("");

          try {
            await sendEmail({
              to: order.email,
              subject: `Order confirmed ${order.orderNumber}`,
              html: orderConfirmationHtml({
                orderNumber: order.orderNumber,
                email: order.email,
                total: formatMoney(toNumber(order.total)),
                itemsHtml,
                configNote: "Configuration details are included with your order.",
              }),
            });
          } catch {
            // Email must not block payment confirmation or webhook ack
          }
        }
      }
    }
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: event as object,
      },
    });
  } catch {
    // Concurrent duplicate insert — safe to treat as success
  }

  return NextResponse.json({ received: true });
}
