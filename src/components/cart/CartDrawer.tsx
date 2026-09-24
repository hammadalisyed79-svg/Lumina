"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatMoney } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  const close = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
  useFocusTrap(drawerOpen, panelRef, close);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close cart"
        onClick={close}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className="relative h-full w-full max-w-md bg-ivory shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <p className="eyebrow mb-1">Shopping</p>
            <h2 className="font-display text-2xl">Your bag</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close bag" className="focus-ring p-1">
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
                <Link href="/shop/lampshades" className="btn-primary" onClick={close}>
                  Browse lampshades
                </Link>
                <Link href="/design-your-shade" className="btn-quiet !py-2" onClick={close}>
                  Design a shade
                </Link>
              </div>
            </div>
          )}
          {items.map((item) => (
            <CartLineItem key={item.id} item={item} variant="drawer" onNavigate={close} />
          ))}
        </div>
        <div className="border-t border-line p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <p className="text-[10px] tracking-[0.08em] uppercase text-muted leading-relaxed">
            Made to order · Stripe secure · Shipping at checkout
          </p>
          <Link href="/cart" className="btn-secondary w-full" onClick={close}>
            View bag
          </Link>
          <Link href="/checkout" className="btn-primary w-full" onClick={close}>
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
