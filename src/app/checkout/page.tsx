"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatGBP } from "@/lib/money";
import { SITE } from "@/lib/site";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping =
    subtotal === 0 ? 0 : subtotal >= SITE.freeShippingFrom ? 0 : SITE.shippingFlat;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl">Checkout</h1>
        <p className="mt-4 text-[var(--muted)]">Your bag is empty.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Shop now
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email")),
      phone: String(fd.get("phone") || ""),
      firstName: String(fd.get("firstName")),
      lastName: String(fd.get("lastName")),
      addressLine1: String(fd.get("addressLine1")),
      addressLine2: String(fd.get("addressLine2") || ""),
      city: String(fd.get("city")),
      county: String(fd.get("county") || ""),
      postcode: String(fd.get("postcode")),
      country: String(fd.get("country") || "United Kingdom"),
      notes: String(fd.get("notes") || ""),
      items: items.map((i) => ({ handle: i.handle, quantity: i.quantity })),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not place order");
      return;
    }
    clear();
    router.push(`/order/${data.orderId}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-5xl mb-10">
        Checkout
      </h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-4">
              Contact
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="email" type="email" required placeholder="Email" className="field sm:col-span-2" />
              <input name="phone" type="tel" placeholder="Phone (optional)" className="field sm:col-span-2" />
            </div>
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-4">
              Shipping address
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="firstName" required placeholder="First name" className="field" />
              <input name="lastName" required placeholder="Last name" className="field" />
              <input name="addressLine1" required placeholder="Address" className="field sm:col-span-2" />
              <input name="addressLine2" placeholder="Apartment, suite, etc." className="field sm:col-span-2" />
              <input name="city" required placeholder="City" className="field" />
              <input name="county" placeholder="County" className="field" />
              <input name="postcode" required placeholder="Postcode" className="field" />
              <input name="country" defaultValue="United Kingdom" className="field" />
              <textarea name="notes" placeholder="Order notes (sizes, fittings…)" className="field sm:col-span-2 min-h-24" />
            </div>
          </section>
        </div>

        <aside className="bg-white/70 border border-[var(--line)] p-6 h-fit">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-4">
            Order
          </h2>
          <ul className="space-y-3 text-sm mb-6">
            {items.map((i) => (
              <li key={i.handle} className="flex justify-between gap-3">
                <span className="line-clamp-2">
                  {i.title} × {i.quantity}
                </span>
                <span className="shrink-0">{formatGBP(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-sm border-t border-[var(--line)] pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatGBP(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatGBP(shipping)}</span>
            </div>
            <div className="flex justify-between font-medium text-base pt-2">
              <span>Total</span>
              <span>{formatGBP(total)}</span>
            </div>
          </div>
          {error && <p className="text-sm text-red-700 mt-4">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 disabled:opacity-60">
            {loading ? "Placing order…" : "Place order"}
          </button>
          <p className="text-xs text-[var(--muted)] mt-3">
            Demo checkout — orders are stored in the local backend database.
          </p>
        </aside>
      </form>
    </div>
  );
}
