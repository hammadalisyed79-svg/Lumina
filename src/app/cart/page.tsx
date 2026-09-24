"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";
import { SHIPPING_PLACEHOLDER_COPY } from "@/lib/shipping/placeholder";
import type { CartValidateInput } from "@/lib/cart/validate";

const allowTestOrders =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ALLOW_TEST_ORDERS === "true";

export default function CartPage() {
  const { items, subtotal, clear, markLineError } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toValidatePayload(): CartValidateInput[] {
    return items.map((item) => {
      if (item.kind === "configured" && item.config) {
        return {
          kind: "configured" as const,
          quantity: item.quantity,
          clientLineId: item.id,
          config: {
            shapeKey: item.config.shapeKey,
            sizeSlug: item.config.sizeSlug,
            fabricSlug: item.config.fabricSlug,
            liningSlug: item.config.liningSlug,
            fittingSlug: item.config.fittingSlug,
            useType: item.config.useType,
            personalisation: item.config.personalisation,
            unitPrice: item.unitPrice,
          },
        };
      }
      return {
        kind: "product" as const,
        quantity: item.quantity,
        clientLineId: item.id,
        productId: item.productId!,
        variantId: item.variantId,
      };
    });
  }

  async function revalidateBag() {
    setValidating(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: toValidatePayload() }),
      });
      const data = await res.json();
      for (const line of data.lines || []) {
        if (!line.clientLineId) continue;
        if (line.ok) {
          markLineError(line.clientLineId, undefined);
        } else {
          const msg =
            line.blocks?.map((b: { message: string }) => b.message).join(" ") ||
            "This item can no longer be ordered.";
          markLineError(line.clientLineId, msg);
        }
      }
      if (data.ok) {
        setMessage("Bag checked — all items are orderable at server prices.");
        return true;
      }
      setError(
        "Some items cannot be ordered. Options were not silently changed — edit or remove the flagged lines."
      );
      return false;
    } catch {
      setError("Could not validate bag. Try again.");
      return false;
    } finally {
      setValidating(false);
    }
  }

  async function createTestOrder() {
    setTestLoading(true);
    setError("");
    setMessage("");
    const ok = await revalidateBag();
    if (!ok) {
      setTestLoading(false);
      return;
    }
    const email = session?.user?.email;
    if (!email) {
      setError("Sign in to create a test order, or use an account email.");
      setTestLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/orders/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lines: toValidatePayload(),
          shipping: {
            fullName: session.user?.name || "Test Customer",
            line1: "Test address",
            city: "London",
            postcode: "SW1A 1AA",
            country: "GB",
          },
          notes: "TEST ORDER from shopping bag",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Test order failed");
        if (data.details?.lines) {
          for (const line of data.details.lines) {
            if (line.clientLineId && line.blocks) {
              markLineError(
                line.clientLineId,
                line.blocks.map((b: { message: string }) => b.message).join(" ")
              );
            }
          }
        }
        return;
      }
      clear();
      setMessage(
        `${data.notice} Order ${data.orderNumber} — paymentStatus UNPAID.`
      );
      router.push(`/account/orders/${data.orderNumber}`);
    } catch {
      setError("Test order request failed.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="container-site section-pad">
      <header className="mb-10 md:mb-14 max-w-2xl">
        <p className="eyebrow mb-3">Your order</p>
        <h1 className="section-title mb-3">Shopping bag</h1>
        <div className="lux-rule" />
      </header>
      {items.length === 0 ? (
        <EmptyState
          eyebrow="Bag"
          title={COPY.cartEmpty.title}
          body={COPY.cartEmpty.body}
          primary={{ href: "/shop/lampshades", label: COPY.cartEmpty.cta }}
          secondary={{ href: "/design-your-shade", label: "Design a shade" }}
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-12">
          <div className="space-y-6">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} variant="page" />
            ))}
          </div>
          <aside className="surface-panel p-6 md:p-8 h-fit space-y-4">
            <p className="eyebrow mb-1">Order summary</p>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Shipping</span>
              <span>TBC</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Discount</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Tax</span>
              <span>—</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between font-medium">
              <span>Estimated total</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-[10px] text-muted">
              {SHIPPING_PLACEHOLDER_COPY.cartNote} This is an order summary, not a
              VAT invoice.
            </p>
            <CommerceTrust compact />
            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-muted" role="status">
                {message}
              </p>
            )}
            <button
              type="button"
              className="btn-quiet w-full text-sm"
              disabled={validating}
              onClick={() => void revalidateBag()}
            >
              {validating ? "Checking…" : "Check bag availability"}
            </button>
            <Link href="/checkout" className="btn-primary w-full mt-2">
              Checkout
            </Link>
            {allowTestOrders && (
              <button
                type="button"
                className="btn-secondary w-full text-sm"
                disabled={testLoading}
                onClick={() => void createTestOrder()}
              >
                {testLoading ? "Creating test order…" : "Create TEST ORDER"}
              </button>
            )}
            <Link
              href="/shop/lampshades"
              className="btn-quiet w-full text-center text-sm"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
