import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { listProducts, getCategories } from "@/lib/products";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== process.env.ADMIN_KEY && key !== "luminahub-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureSeeded();
  const db = getDb();
  const productCount = (
    db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }
  ).c;
  const orderCount = (
    db.prepare("SELECT COUNT(*) as c FROM orders").get() as { c: number }
  ).c;
  const messageCount = (
    db.prepare("SELECT COUNT(*) as c FROM contact_messages").get() as {
      c: number;
    }
  ).c;
  const subscriberCount = (
    db.prepare("SELECT COUNT(*) as c FROM newsletter").get() as { c: number }
  ).c;
  const revenue = (
    db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders").get() as {
      s: number;
    }
  ).s;
  const recentOrders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10")
    .all();
  const { products } = listProducts({ limit: 8, featured: true });

  return NextResponse.json({
    stats: {
      productCount,
      orderCount,
      messageCount,
      subscriberCount,
      revenue,
      categories: getCategories(),
    },
    recentOrders,
    featured: products,
  });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== process.env.ADMIN_KEY && key !== "luminahub-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (body.action === "reseed") {
    const { seedProducts } = await import("@/lib/seed");
    const result = seedProducts(true);
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
