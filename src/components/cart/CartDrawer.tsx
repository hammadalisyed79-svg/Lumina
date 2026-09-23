"use client";

import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, updateQty, remove } = useCart();

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close cart"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="relative h-full w-full max-w-md bg-[color:var(--ivory)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <p className="eyebrow mb-1">Shopping</p>
            <h2 className="font-display text-2xl">Your bag</h2>
          </div>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 && (
            <div className="py-8 text-center space-y-4">
              <p className="eyebrow">Empty</p>
              <p className="prose-muted text-sm max-w-xs mx-auto">
                Your bag is waiting. Discover a silhouette or compose a shade in the studio.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <Link
                  href="/shop/lampshades"
                  className="btn-primary"
                  onClick={() => setDrawerOpen(false)}
                >
                  Browse lampshades
                </Link>
                <Link
                  href="/design-your-shade"
                  className="btn-quiet !py-2"
                  onClick={() => setDrawerOpen(false)}
                >
                  Design a shade
                </Link>
              </div>
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-24 w-20 bg-[color:var(--stone)] shrink-0">
                {item.imageUrl && (
                  <MediaImage
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                {item.config && (
                  <p className="text-xs text-[color:var(--muted)] mt-1 leading-relaxed">
                    {item.config.shapeName} · {item.config.fabricName} · {item.config.sizeName}
                    <br />
                    {item.config.liningName} · {item.config.fittingName}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm">{formatMoney(item.unitPrice * item.quantity)}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-[color:var(--muted)] underline mt-2"
                  onClick={() => remove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[color:var(--line)] p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <p className="text-[10px] tracking-[0.08em] uppercase text-muted leading-relaxed">
            Made to order · Stripe secure · Shipping at checkout
          </p>
          <Link
            href="/cart"
            className="btn-secondary w-full"
            onClick={() => setDrawerOpen(false)}
          >
            View bag
          </Link>
          <Link
            href="/checkout"
            className="btn-primary w-full"
            onClick={() => setDrawerOpen(false)}
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
