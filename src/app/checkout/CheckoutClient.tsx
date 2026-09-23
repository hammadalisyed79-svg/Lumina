"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";

type ShippingMethod = { id: string; name: string; price: number; description?: string };

const PENDING_ORDER_KEY = "lumina_pending_order";

export default function CheckoutClient() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        setMethods(d.methods || []);
        setShippingMethodId(d.methods?.[0]?.id || "");
      });
  }, []);

  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    const failed = searchParams.get("failed");
    if (!cancelled && !failed) return;
    const pending = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!pending) {
      setNotice(
        failed
          ? "Payment was not completed. Your bag is unchanged."
          : "Checkout was cancelled. No payment was taken."
      );
      return;
    }
    fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: pending,
        outcome: failed ? "failed" : "cancelled",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        sessionStorage.removeItem(PENDING_ORDER_KEY);
        setNotice(
          failed
            ? d.updated
              ? `Payment failed for ${pending}. Order remains unpaid.`
              : `Payment failed. Order ${pending} was not marked paid.`
            : d.updated
              ? `Checkout cancelled for ${pending}. Order is not paid.`
              : `Checkout cancelled. Order ${pending} was already closed.`
        );
      })
      .catch(() => {
        setNotice("Could not record checkout cancellation. No payment was taken.");
      });
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
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
    if (data.orderNumber) {
      sessionStorage.setItem(PENDING_ORDER_KEY, data.orderNumber);
    }
    clear();
    if (data.url?.startsWith("http")) {
      window.location.href = data.url;
    } else {
      router.push(data.url);
    }
  }

  if (items.length === 0 && !notice && !error) {
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
    <div className="container-site section-pad grid lg:grid-cols-2 gap-12 lg:gap-16">
      <div>
        <header className="mb-8 md:mb-10">
          <p className="eyebrow mb-3">Secure payment</p>
          <h1 className="section-title mb-3">Checkout</h1>
          <div className="lux-rule" />
        </header>
        {notice && (
          <p className="text-sm border border-[color:var(--line)] bg-white/80 p-3 mb-4">
            {notice}
          </p>
        )}
        {items.length === 0 ? (
          <Link href="/shop/lampshades" className="btn-primary">
            Continue shopping
          </Link>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="label">Email</span>
              <input name="email" type="email" required className="input" />
            </label>
            <label className="block">
              <span className="label">Full name</span>
              <input name="fullName" required className="input" />
            </label>
            <label className="block">
              <span className="label">Address line 1</span>
              <input name="line1" required className="input" />
            </label>
            <label className="block">
              <span className="label">Address line 2</span>
              <input name="line2" className="input" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="label">City</span>
                <input name="city" required className="input" />
              </label>
              <label className="block">
                <span className="label">Postcode</span>
                <input name="postcode" required className="input" />
              </label>
            </div>
            <label className="block">
              <span className="label">County</span>
              <input name="county" className="input" />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input name="phone" className="input" />
            </label>

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
                    {m.price > 0 ? ` — ${formatMoney(m.price)}` : " — free / calculated"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label">Coupon</span>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="input"
              />
            </label>

            {error && (
              <p className="text-sm text-red-700 whitespace-pre-wrap border border-red-200 bg-red-50 p-3">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Processing…" : "Pay securely with Stripe"}
            </button>
            <p className="text-xs text-[color:var(--muted)]">
              Payment is processed by Stripe on this site. Orders stay unpaid until Stripe confirms
              payment via webhook.
            </p>
          </form>
        )}
      </div>
      <aside className="surface-panel p-6 md:p-8 h-fit">
        <p className="eyebrow mb-2">Your bag</p>
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
        <p className="text-xs text-muted mt-4">
          Shipping is calculated at Stripe checkout from studio rates. Tax is confirmed before payment.
        </p>
      </aside>
    </div>
  );
}
