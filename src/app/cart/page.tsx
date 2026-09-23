"use client";

import Image from "next/image";
import Link from "next/link";
import { formatGBP } from "@/lib/money";
import { SITE } from "@/lib/site";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const shipping =
    subtotal === 0 ? 0 : subtotal >= SITE.freeShippingFrom ? 0 : SITE.shippingFlat;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl">Your bag</h1>
        <p className="mt-4 text-[var(--muted)]">Nothing here yet.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-5xl mb-10">Your bag</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.handle}
              className="flex gap-4 border-b border-[var(--line)] pb-6"
            >
              <div className="relative w-24 h-28 bg-[var(--stone)] shrink-0 overflow-hidden">
                {item.image && (
                  <Image src={item.image} alt="" fill className="object-cover" sizes="96px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.handle}`}
                  className="font-medium line-clamp-2 hover:text-[var(--brass)]"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm">{formatGBP(item.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(item.handle, Number(e.target.value) || 1)
                    }
                    className="field w-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.handle)}
                    className="text-sm text-[var(--muted)] underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-medium shrink-0">
                {formatGBP(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <aside className="bg-white/70 border border-[var(--line)] p-6 h-fit">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-4">
            Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatGBP(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatGBP(shipping)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[var(--line)] text-base font-medium">
              <span>Total</span>
              <span>{formatGBP(total)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary w-full mt-6">
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
