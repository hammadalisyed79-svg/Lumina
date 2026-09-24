import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/orders/create";
import { writeAuditLog } from "@/lib/security/audit";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import type { CartValidateInput } from "@/lib/cart/validate";

const lineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("configured"),
    quantity: z.number().int().min(1).max(20),
    config: z.object({
      shapeKey: z.string(),
      sizeSlug: z.string(),
      fabricSlug: z.string(),
      liningSlug: z.string(),
      fittingSlug: z.string(),
      useType: z.string().nullable().optional(),
      personalisation: z.string().max(200).optional(),
      unitPrice: z.number().optional(),
    }),
  }),
  z.object({
    kind: z.literal("product"),
    quantity: z.number().int().min(1).max(20),
    productId: z.string(),
    variantId: z.string().optional(),
  }),
]);

const schema = z.object({
  email: z.string().email(),
  lines: z.array(lineSchema).min(1),
  shippingMethodId: z.string().optional(),
  couponCode: z.string().optional(),
  shipping: z
    .object({
      fullName: z.string().optional(),
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      county: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

function testOrdersAllowed() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_TEST_ORDERS === "true"
  );
}

/**
 * Dev / staging TEST ORDER — creates a real order snapshot without payment.
 * Never marks payment as successful.
 */
export async function POST(req: Request) {
  if (!testOrdersAllowed()) {
    return NextResponse.json(
      {
        error: "Test orders are disabled outside development",
        mode: "blocked",
      },
      { status: 403 }
    );
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`test-order:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await auth();
  const result = await createOrderFromCart({
    email: parsed.data.email,
    userId: session?.user?.id,
    lines: parsed.data.lines as CartValidateInput[],
    shippingMethodId: parsed.data.shippingMethodId,
    couponCode: parsed.data.couponCode,
    shipping: parsed.data.shipping,
    notes: parsed.data.notes,
    source: "test",
    paymentIndependent: true,
    status: "PENDING",
    paymentStatus: "UNPAID",
    productionStatus: "QUEUED",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.details },
      { status: result.status }
    );
  }

  await writeAuditLog({
    userId: session?.user?.id,
    action: "order.test_create",
    entity: "Order",
    entityId: result.orderId,
    meta: { orderNumber: result.orderNumber, total: result.total },
    ip,
  });

  return NextResponse.json({
    ok: true,
    mode: "test",
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    paymentStatus: "UNPAID",
    status: "PENDING",
    productionStatus: "QUEUED",
    subtotal: result.subtotal,
    shippingTotal: result.shippingTotal,
    discountTotal: result.discountTotal,
    taxTotal: result.taxTotal,
    total: result.total,
    notice:
      "TEST ORDER created. Payment was not taken and paymentStatus remains UNPAID.",
  });
}
