"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";
import { track } from "@/lib/analytics";
import { roundMoney } from "@/lib/pricing";

type ShippingMethod = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

const PENDING_ORDER_KEY = "lumina_pending_order";

const STEPS = ["Bag", "Details", "Payment"] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-error mt-1.5" role="alert">
      {message}
    </p>
  );
}

export default function CheckoutClient() {
  const {
    items,
    subtotal,
    clear,
    snapshotForCheckout,
    restoreCheckoutSnapshot,
  } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [shippingLoaded, setShippingLoaded] = useState(false);
  const [shippingError, setShippingError] = useState(false);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"warn" | "error">("warn");
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [recoveryDone, setRecoveryDone] = useState(() => {
    if (typeof window === "undefined") return true;
    const q = new URLSearchParams(window.location.search);
    return !(q.get("cancelled") || q.get("failed"));
  });

  useEffect(() => {
    track({ event: "begin_checkout", value: subtotal, items: items.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  function loadShipping() {
    setShippingError(false);
    setShippingLoaded(false);
    fetch("/api/shipping")
      .then((r) => {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then((d) => {
        const list = d.methods || [];
        setMethods(list);
        setShippingMethodId((prev) =>
          list.some((m: ShippingMethod) => m.id === prev) ? prev : list[0]?.id || ""
        );
      })
      .catch(() => {
        setMethods([]);
        setShippingError(true);
      })
      .finally(() => setShippingLoaded(true));
  }

  useEffect(() => {
    loadShipping();
  }, []);

  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    const failed = searchParams.get("failed");
    if (!cancelled && !failed) {
      setRecoveryDone(true);
      return;
    }

    const didRestore = restoreCheckoutSnapshot();
    if (didRestore) setRestored(true);

    setNoticeKind(failed ? "error" : "warn");
    const pending = sessionStorage.getItem(PENDING_ORDER_KEY);
    const finish = (msg: string) => {
      setNotice(msg);
      setRecoveryDone(true);
    };

    if (!pending) {
      finish(
        failed
          ? COPY.paymentNotice.failed
          : didRestore
            ? COPY.paymentNotice.cancelledRestored
            : COPY.paymentNotice.cancelled
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
        if (failed) {
          finish(
            d.updated
              ? `Payment failed for ${pending}. Order remains unpaid — your bag was restored so you can try again.`
              : COPY.paymentNotice.failed
          );
        } else {
          finish(
            d.updated
              ? `Checkout cancelled for ${pending}. No payment was taken — your bag was restored.`
              : didRestore
                ? COPY.paymentNotice.cancelledRestored
                : COPY.paymentNotice.cancelled
          );
        }
      })
      .catch(() => {
        finish(
          didRestore
            ? COPY.paymentNotice.cancelledRestored
            : COPY.paymentNotice.cancelled
        );
      });
  }, [searchParams, restoreCheckoutSnapshot]);

  async function applyCoupon() {
    setCouponError("");
    setCouponApplied(null);
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCouponError(data.error || "Coupon could not be applied");
        return;
      }
      setCouponCode(data.code);
      setCouponApplied({ code: data.code, discount: data.discount });
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setNotice("");
    if (!shippingMethodId) {
      setError(
        shippingLoaded && methods.length === 0
          ? "Shipping is not configured yet. Please contact the studio to complete your order."
          : "Select a shipping method to continue."
      );
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email")),
      couponCode: couponApplied?.code || undefined,
      shippingMethodId,
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

    try {
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
        const fe = data.details?.fieldErrors as Record<string, string[] | undefined> | undefined;
        if (fe) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(fe)) {
            if (v?.[0]) mapped[k] = v[0];
          }
          setFieldErrors(mapped);
        }
        if (res.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(`${data.error || "Checkout failed"}${blockers}`);
        }
        return;
      }
      if (data.mode === "blocked") {
        setError(data.error || "Checkout is not configured");
        return;
      }
      if (data.orderNumber) {
        sessionStorage.setItem(PENDING_ORDER_KEY, data.orderNumber);
      }
      snapshotForCheckout();
      clear();
      if (data.url?.startsWith("http")) {
        window.location.href = data.url;
      } else {
        router.push(data.url);
      }
    } catch {
      setLoading(false);
      setError("Could not reach checkout. Check your connection and try again.");
    }
  }

  const cancelledParam = searchParams.get("cancelled");
  const failedParam = searchParams.get("failed");
  const selectedShipping = methods.find((m) => m.id === shippingMethodId);
  const shippingPrice = selectedShipping?.price ?? 0;
  const discount = couponApplied?.discount ?? 0;
  const estimatedTotal = useMemo(
    () => roundMoney(Math.max(0, subtotal - discount) + shippingPrice),
    [subtotal, discount, shippingPrice]
  );

  if (!recoveryDone) {
    return (
      <div className="container-site section-pad">
        <p className="eyebrow mb-3">Checkout</p>
        <h1 className="section-title mb-3">Restoring your bag…</h1>
        <p className="prose-muted">One moment while we recover your items.</p>
      </div>
    );
  }

  if (items.length === 0 && !restored && (failedParam || cancelledParam)) {
    const failed = Boolean(failedParam);
    const copy = failed ? COPY.paymentFailed : COPY.paymentCancelled;
    return (
      <div className="container-site section-pad">
        <EmptyState
          eyebrow={failed ? "Payment" : "Checkout"}
          title={copy.title}
          body={copy.body}
          primary={{ href: "/cart", label: "View bag" }}
          secondary={{ href: "/shop/lampshades", label: "Continue shopping" }}
        />
      </div>
    );
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

  const noShipping = shippingLoaded && methods.length === 0;

  return (
    <div className="container-site section-pad">
      <div className="mb-8 md:mb-10 max-w-xl">
        <p className="eyebrow mb-3">Secure payment</p>
        <h1 className="section-title mb-3">Checkout</h1>
        <div className="lux-rule" />
        <nav className="checkout-steps mt-6" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`checkout-step ${i === 1 ? "is-active" : i < 1 ? "is-done" : ""}`}
            >
              <span className="checkout-step-num">{i + 1}</span>
              {label}
            </span>
          ))}
        </nav>
        <p className="mt-4">
          <Link href="/cart" className="text-sm underline underline-offset-4 hover:text-bronze">
            Back to bag
          </Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        <div>
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
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <section className="space-y-4">
                <h2 className="font-display text-2xl tracking-tight">Contact</h2>
                <label className="block">
                  <span className="label">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="input"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  <FieldError message={fieldErrors.email} />
                </label>
                <label className="block">
                  <span className="label">Phone</span>
                  <input name="phone" className="input" autoComplete="tel" />
                </label>
              </section>

              <section className="space-y-4 pt-2 border-t border-line">
                <h2 className="font-display text-2xl tracking-tight pt-4">Delivery</h2>
                <label className="block">
                  <span className="label">Full name</span>
                  <input
                    name="fullName"
                    required
                    className="input"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                  />
                  <FieldError message={fieldErrors.fullName || fieldErrors["shipping.fullName"]} />
                </label>
                <label className="block">
                  <span className="label">Address line 1</span>
                  <input
                    name="line1"
                    required
                    className="input"
                    autoComplete="address-line1"
                    aria-invalid={Boolean(fieldErrors.line1)}
                  />
                  <FieldError message={fieldErrors.line1} />
                </label>
                <label className="block">
                  <span className="label">Address line 2</span>
                  <input name="line2" className="input" autoComplete="address-line2" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="label">City</span>
                    <input
                      name="city"
                      required
                      className="input"
                      autoComplete="address-level2"
                      aria-invalid={Boolean(fieldErrors.city)}
                    />
                    <FieldError message={fieldErrors.city} />
                  </label>
                  <label className="block">
                    <span className="label">Postcode</span>
                    <input
                      name="postcode"
                      required
                      className="input"
                      autoComplete="postal-code"
                      aria-invalid={Boolean(fieldErrors.postcode)}
                    />
                    <FieldError message={fieldErrors.postcode} />
                  </label>
                </div>
                <label className="block">
                  <span className="label">County</span>
                  <input name="county" className="input" autoComplete="address-level1" />
                </label>
              </section>

              <section className="space-y-4 pt-2 border-t border-line">
                <h2 className="font-display text-2xl tracking-tight pt-4">Shipping &amp; extras</h2>
                <div>
                  <span className="label">Shipping</span>
                  {shippingError ? (
                    <div className="notice-panel is-error mt-1 space-y-2">
                      <p>Could not load shipping options.</p>
                      <button type="button" className="btn-quiet text-sm" onClick={loadShipping}>
                        Retry
                      </button>
                    </div>
                  ) : noShipping ? (
                    <p className="notice-panel is-error mt-1">
                      Shipping is not available online right now.{" "}
                      <Link href="/contact" className="underline">
                        Contact the studio
                      </Link>{" "}
                      to complete your order.
                    </p>
                  ) : (
                    <div className="mt-1 space-y-2">
                      {methods.map((m) => (
                        <label
                          key={m.id}
                          className={`flex gap-3 items-start border p-3 cursor-pointer transition-colors ${
                            shippingMethodId === m.id
                              ? "border-ink bg-ivory"
                              : "border-line hover:border-champagne"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shippingMethod"
                            className="mt-1"
                            checked={shippingMethodId === m.id}
                            onChange={() => setShippingMethodId(m.id)}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="flex justify-between gap-3 text-sm font-medium">
                              <span>{m.name}</span>
                              <span>
                                {m.price > 0 ? formatMoney(m.price) : "Included"}
                              </span>
                            </span>
                            {m.description && (
                              <span className="block text-xs text-muted mt-1 leading-relaxed">
                                {m.description}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="label">Coupon</span>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponApplied(null);
                        setCouponError("");
                      }}
                      placeholder="Optional code"
                      className="input"
                      aria-invalid={Boolean(couponError)}
                      disabled={Boolean(couponApplied)}
                    />
                    {couponApplied ? (
                      <button
                        type="button"
                        className="btn-secondary shrink-0"
                        onClick={clearCoupon}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary shrink-0"
                        onClick={applyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? "…" : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-sm text-error mt-2" role="alert">
                      {couponError}
                    </p>
                  )}
                  {couponApplied && (
                    <p className="text-sm text-muted mt-2">
                      {couponApplied.code} applied — save {formatMoney(couponApplied.discount)}
                    </p>
                  )}
                </div>
              </section>

              {error && (
                <p className="notice-panel is-error whitespace-pre-wrap" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || noShipping || shippingError}
              >
                {loading ? "Processing…" : "Continue to Stripe payment"}
              </button>
              <p className="text-xs text-muted text-center leading-relaxed">
                You will leave this site briefly to pay securely with Stripe. Your bag is kept if
                you cancel.
              </p>
              <CommerceTrust />
            </form>
          )}
        </div>

        <aside className="surface-panel p-6 md:p-8 h-fit lg:sticky lg:top-28">
          <p className="eyebrow mb-2">Your bag</p>
          <h2 className="font-display text-2xl tracking-tight mb-5">Order summary</h2>
          <ul className="space-y-5 mb-6">
            {items.map((i) => (
              <li key={i.id}>
                <CartLineItem item={i} variant="summary" />
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-sm border-t border-line pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-muted">
                <span>Discount ({couponApplied.code})</span>
                <span>−{formatMoney(couponApplied.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>
                {!shippingLoaded
                  ? "…"
                  : selectedShipping
                    ? shippingPrice > 0
                      ? formatMoney(shippingPrice)
                      : "Included"
                    : "Select method"}
              </span>
            </div>
            <div className="flex justify-between font-medium text-base pt-2 border-t border-line">
              <span>Estimated total</span>
              <span>{formatMoney(estimatedTotal)}</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-4 leading-relaxed">
            Final total is confirmed on Stripe. Coupons only redeem after successful payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
