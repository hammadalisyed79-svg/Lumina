"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";

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
  const [noticeKind, setNoticeKind] = useState<"warn" | "error">("warn");
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
    setNoticeKind(failed ? "error" : "warn");
    const pending = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!pending) {
      setNotice(failed ? COPY.paymentNotice.failed : COPY.paymentNotice.cancelled);
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
        if (failed) {
          setNotice(
            d.updated
              ? `Payment failed for ${pending}. Order remains unpaid — you can try again.`
              : COPY.paymentNotice.failed
          );
        } else {
          setNotice(
            d.updated
              ? `Checkout cancelled for ${pending}. No payment was taken.`
              : COPY.paymentNotice.cancelled
          );
        }
      })
      .catch(() => {
        setNotice(COPY.paymentNotice.cancelled);
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
      <div className="container-site section-pad">
        <EmptyState
          eyebrow="Checkout"
          title={COPY.checkoutEmpty.title}
          body={COPY.checkoutEmpty.body}
          primary={{ href: "/shop/lampshades", label: COPY.checkoutEmpty.cta }}
          secondary={{ href: "/design-your-shade", label: "Design a shade" }}
        />
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
          <p className={`notice-panel mb-5 ${noticeKind === "error" ? "is-error" : "is-warn"}`}>
            {notice}
          </p>
        )}
        {items.length === 0 ? (
          <EmptyState
            eyebrow="Bag"
            title={COPY.checkoutEmpty.title}
            body={COPY.paymentNotice.cancelled}
            primary={{ href: "/shop/lampshades", label: "Continue shopping" }}
            className="py-8 text-left max-w-none mx-0 [&_.lux-rule]:mx-0 [&_div.flex]:justify-start"
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="label">Email</span>
              <input name="email" type="email" required className="input" autoComplete="email" />
            </label>
            <label className="block">
              <span className="label">Full name</span>
              <input name="fullName" required className="input" autoComplete="name" />
            </label>
            <label className="block">
              <span className="label">Address line 1</span>
              <input name="line1" required className="input" autoComplete="address-line1" />
            </label>
            <label className="block">
              <span className="label">Address line 2</span>
              <input name="line2" className="input" autoComplete="address-line2" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="label">City</span>
                <input name="city" required className="input" autoComplete="address-level2" />
              </label>
              <label className="block">
                <span className="label">Postcode</span>
                <input name="postcode" required className="input" autoComplete="postal-code" />
              </label>
            </div>
            <label className="block">
              <span className="label">County</span>
              <input name="county" className="input" autoComplete="address-level1" />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input name="phone" className="input" autoComplete="tel" />
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
                    {m.price > 0 ? ` — ${formatMoney(m.price)}` : " — calculated"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label">Coupon</span>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Optional code"
                className="input"
              />
            </label>

            {error && <p className="notice-panel is-error whitespace-pre-wrap">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Processing…" : "Pay securely with Stripe"}
            </button>
            <CommerceTrust />
          </form>
        )}
      </div>
      <aside className="surface-panel p-6 md:p-8 h-fit">
        <p className="eyebrow mb-2">Your bag</p>
        <h2 className="font-display text-2xl tracking-tight mb-4">Order summary</h2>
        <ul className="space-y-3 mb-6">
          {items.map((i) => (
            <li key={i.id} className="text-sm flex justify-between gap-4">
              <span>
                {i.quantity}× {i.title}
                {i.config && (
                  <span className="block text-muted text-xs mt-1">
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
        <p className="text-xs text-muted mt-4 leading-relaxed">
          Shipping and tax are confirmed before you pay. Orders stay unpaid until Stripe confirms
          payment.
        </p>
      </aside>
    </div>
  );
}
