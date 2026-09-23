"use client";

import Image from "next/image";
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--line)]">
          <h2 className="font-display text-2xl">Your bag</h2>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 && (
            <p className="prose-muted">Your bag is empty. Explore lampshades or design your own.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-24 w-20 bg-[color:var(--stone)] shrink-0">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" />
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
                  <div className="flex items-center border border-[color:var(--line)]">
                    <button
                      type="button"
                      className="px-2 py-1"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="px-2 text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1"
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
