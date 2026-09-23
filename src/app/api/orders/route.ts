import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { getProductByHandle } from "@/lib/products";

export const runtime = "nodejs";

const orderSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  county: z.string().optional(),
  postcode: z.string().min(2),
  country: z.string().default("United Kingdom"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        handle: z.string(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const db = getDb();
  if (id) {
    const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order: row });
  }
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50")
    .all();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const lineItems = [];
  let subtotal = 0;

  for (const item of data.items) {
    const product = getProductByHandle(item.handle);
    if (!product || !product.available) {
      return NextResponse.json(
        { error: `Product unavailable: ${item.handle}` },
        { status: 400 }
      );
    }
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    lineItems.push({
      handle: product.handle,
      title: product.title,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const shipping = subtotal >= 75 ? 0 : 4.95;
  const total = subtotal + shipping;
  const id = randomUUID();

  getDb()
    .prepare(
      `INSERT INTO orders (
        id, email, phone, first_name, last_name, address_line1, address_line2,
        city, county, postcode, country, items, subtotal, shipping, total, status, notes
      ) VALUES (
        @id, @email, @phone, @first_name, @last_name, @address_line1, @address_line2,
        @city, @county, @postcode, @country, @items, @subtotal, @shipping, @total, 'pending', @notes
      )`
    )
    .run({
      id,
      email: data.email,
      phone: data.phone || null,
      first_name: data.firstName,
      last_name: data.lastName,
      address_line1: data.addressLine1,
      address_line2: data.addressLine2 || null,
      city: data.city,
      county: data.county || null,
      postcode: data.postcode,
      country: data.country,
      items: JSON.stringify(lineItems),
      subtotal,
      shipping,
      total,
      notes: data.notes || null,
    });

  return NextResponse.json({
    ok: true,
    orderId: id,
    subtotal,
    shipping,
    total,
  });
}
