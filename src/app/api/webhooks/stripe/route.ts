import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { orderConfirmationHtml, sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import Stripe from "stripe";

export const runtime = "nodejs";

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
      { status: 400 },
    );
  }

  // Idempotency
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.stripeWebhookEvent.create({
    data: {
      eventId: event.id,
      type: event.type,
      payload: event as object,
    },
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          stripePaymentIntent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          events: {
            create: { type: "paid", message: "Payment confirmed via Stripe" },
          },
        },
        include: { items: true },
      });

      const itemsHtml = order.items
        .map(
          (i) =>
            `<p>${i.quantity}× ${i.title} — ${formatMoney(toNumber(i.lineTotal))}${
              i.configJson
                ? `<br/><small>${JSON.stringify(i.configJson)}</small>`
                : ""
            }</p>`,
        )
        .join("");

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
    }
  }

  return NextResponse.json({ received: true });
}
