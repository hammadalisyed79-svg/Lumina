import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatGBP } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        items: string;
        subtotal: number;
        shipping: number;
        total: number;
        status: string;
        created_at: string;
      }
    | undefined;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Order not found
        </h1>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Back to shop
        </Link>
      </div>
    );
  }

  const items = JSON.parse(order.items) as {
    title: string;
    quantity: number;
    lineTotal: number;
  }[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
        Confirmed
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl">
        Thank you, {order.first_name}
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        Order <span className="text-[var(--ink)] font-mono text-sm">{order.id}</span>{" "}
        is saved. A confirmation would go to {order.email}.
      </p>

      <div className="mt-10 border border-[var(--line)] bg-white/70 p-6 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm gap-4">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatGBP(item.lineTotal)}</span>
          </div>
        ))}
        <div className="border-t border-[var(--line)] pt-3 flex justify-between text-sm">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatGBP(order.shipping)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatGBP(order.total)}</span>
        </div>
      </div>

      <Link href="/shop" className="btn-outline mt-10 inline-flex">
        Continue shopping
      </Link>
    </div>
  );
}
