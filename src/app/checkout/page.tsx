"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";

type ShippingMethod = { id: string; name: string; price: number; description?: string };

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        setMethods(d.methods || []);
        setShippingMethodId(d.methods?.[0]?.id || "");
      });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email")),
      couponCode: couponCode || undefined,
      shippingMethodId: shippingMethodId || undefined,
      shipping: {
        fullName: String(fd.get("fullName")),
        line1: String(fd.get("line1")),
        line2: String(fd.get("line2") || ""),
        city: String(fd.get("city")),
        county: String(fd.get("county") || ""),
        postcode: String(fd.get("postcode")),
        country: "GB",
        phone: String(fd.get("phone") || ""),
      },
      lines: items.map((i) => ({
        kind: i.kind,
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        config: i.config
          ? {
              shapeKey: i.config.shapeKey,
              fabricSlug: i.config.fabricSlug,
              sizeSlug: i.config.sizeSlug,
              liningSlug: i.config.liningSlug,
              fittingSlug: i.config.fittingSlug,
            }
          : undefined,
      })),
    };

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      const blockers = Array.isArray(data.blockers)
        ? `\nRequired: ${data.blockers.join(", ")}`
        : "";
      setError(`${data.error || "Checkout failed"}${blockers}`);
      return;
    }
    if (data.mode === "blocked") {
      setError(data.error || "Checkout is not configured");
      return;
    }
    clear();
    if (data.url?.startsWith("http")) {
      window.location.href = data.url;
    } else {
      router.push(data.url);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-20 text-center">
        <p className="prose-muted mb-4">Nothing to checkout.</p>
        <Link href="/shop/lampshades" className="btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-10 md:py-14 grid lg:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-4xl mb-8">Checkout</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="fullName" required placeholder="Full name" className="input" />
          <input name="line1" required placeholder="Address line 1" className="input" />
          <input name="line2" placeholder="Address line 2" className="input" />
          <div className="grid grid-cols-2 gap-3">
            <input name="city" required placeholder="City" className="input" />
            <input name="postcode" required placeholder="Postcode" className="input" />
          </div>
          <input name="county" placeholder="County" className="input" />
          <input name="phone" placeholder="Phone" className="input" />

          <label className="block">
            <span className="label">Shipping</span>
            <select
              className="input"
              value={shippingMethodId}
              onChange={(e) => setShippingMethodId(e.target.value)}
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.price > 0 ? ` — ${formatMoney(m.price)}` : " — set at Shopify checkout"}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Coupon</span>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="WELCOME10"
              className="input"
            />
          </label>

          {error && (
            <p className="text-sm text-red-700 whitespace-pre-wrap border border-red-200 bg-red-50 p-3">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Processing…" : "Continue to secure checkout"}
          </button>
          <p className="text-xs text-[color:var(--muted)]">
            Live payments require Shopify Storefront checkout credentials. Until those are
            set, checkout will explain what is missing instead of simulating a paid order.
          </p>
        </form>
      </div>
      <aside className="border border-[color:var(--line)] p-6 h-fit bg-white/60">
        <h2 className="font-display text-2xl mb-4">Order summary</h2>
        <ul className="space-y-3 mb-6">
          {items.map((i) => (
            <li key={i.id} className="text-sm flex justify-between gap-4">
              <span>
                {i.quantity}× {i.title}
                {i.config && (
                  <span className="block text-[color:var(--muted)] text-xs mt-1">
                    {i.config.shapeName} / {i.config.fabricName} / {i.config.sizeName}
                  </span>
                )}
              </span>
              <span>{formatMoney(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-medium">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-4">
          Final shipping and discounts are recalculated on the server before payment.
        </p>
      </aside>
    </div>
  );
}
