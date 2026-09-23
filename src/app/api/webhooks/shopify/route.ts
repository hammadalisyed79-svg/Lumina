import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyShopifyWebhookHmac } from "@/lib/shopify";
import {
  markOrderCancelledOnce,
  markOrderPaidOnce,
  markOrderPaymentFailedOnce,
} from "@/lib/orders/payment";

export const runtime = "nodejs";

function noteValue(
  notes: { name?: string; value?: string }[] | undefined,
  key: string
) {
  return notes?.find((n) => n.name === key || n.name === `attributes[${key}]`)
    ?.value;
}

function attributeValue(
  attrs: { name?: string; key?: string; value?: string }[] | undefined,
  key: string
) {
  return attrs?.find((a) => a.name === key || a.key === key)?.value;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic") || "unknown";
  const eventId =
    req.headers.get("x-shopify-webhook-id") ||
    req.headers.get("x-shopify-event-id") ||
    `${topic}:${req.headers.get("x-shopify-triggered-at") || Date.now()}`;

  if (!verifyShopifyWebhookHmac(raw, hmac)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  const existing = await prisma.shopifyWebhookEvent.findUnique({
    where: { eventId },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await prisma.shopifyWebhookEvent.create({
    data: { eventId, topic, payload: payload as Prisma.InputJsonValue },
  });

  const noteAttrs =
    (payload.note_attributes as { name?: string; value?: string }[]) ||
    (payload.noteAttributes as { name?: string; value?: string }[]);
  const cartAttrs =
    (payload.attributes as { name?: string; key?: string; value?: string }[]) ||
    [];
  const orderNumber =
    noteValue(noteAttrs, "lumina_order_number") ||
    attributeValue(cartAttrs, "lumina_order_number") ||
    (typeof payload.tags === "string" &&
    payload.tags.match(/LH-\d{8}-[A-Z0-9]+/)
      ? payload.tags.match(/LH-\d{8}-[A-Z0-9]+/)![0]
      : null);

  const shopifyOrderId =
    payload.admin_graphql_api_id != null
      ? String(payload.admin_graphql_api_id)
      : payload.id != null
        ? String(payload.id)
        : undefined;

  if (topic === "orders/paid" || topic === "orders/create") {
    const financial =
      typeof payload.financial_status === "string"
        ? payload.financial_status
        : "";
    if (topic === "orders/create" && financial && financial !== "paid") {
      // Created but not paid — do not mark paid
      return NextResponse.json({
        received: true,
        paid: false,
        reason: "order_created_unpaid",
      });
    }
    if (!orderNumber) {
      return NextResponse.json({
        received: true,
        paid: false,
        reason: "missing_lumina_order_number",
      });
    }
    const result = await markOrderPaidOnce({
      orderNumber,
      shopifyOrderId,
      eventMessage: `Payment confirmed via Shopify (${topic})`,
      meta: { eventId, topic, shopifyOrderId },
    });
    return NextResponse.json({
      received: true,
      paid: result.updated,
      duplicatePayment: !result.updated,
    });
  }

  if (topic === "orders/cancelled" || topic === "checkouts/delete") {
    if (orderNumber) {
      await markOrderCancelledOnce({
        orderNumber,
        reason: `Cancelled via Shopify (${topic})`,
      });
    }
    return NextResponse.json({ received: true, cancelled: Boolean(orderNumber) });
  }

  if (topic === "orders/updated") {
    const financial =
      typeof payload.financial_status === "string"
        ? payload.financial_status
        : "";
    if (financial === "paid" && orderNumber) {
      const result = await markOrderPaidOnce({
        orderNumber,
        shopifyOrderId,
        eventMessage: `Payment confirmed via Shopify (${topic})`,
        meta: { eventId, topic, shopifyOrderId },
      });
      return NextResponse.json({
        received: true,
        paid: result.updated,
        duplicatePayment: !result.updated,
      });
    }
    if (
      (financial === "voided" || financial === "expired") &&
      orderNumber
    ) {
      await markOrderPaymentFailedOnce({
        orderNumber,
        reason: `Payment ${financial} via Shopify (${topic})`,
      });
      return NextResponse.json({ received: true, failed: true });
    }
  }

  return NextResponse.json({ received: true, ignored: true, topic });
}
