"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";

export default function CartPage() {
  const { items, subtotal, updateQty, remove } = useCart();

  return (
    <div className="container-site section-pad">
      <header className="mb-10 md:mb-14 max-w-2xl">
        <p className="eyebrow mb-3">Your order</p>
        <h1 className="section-title mb-3">Shopping bag</h1>
        <div className="lux-rule" />
      </header>
      {items.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto">
          <h2 className="font-display text-3xl mb-3">{COPY.cartEmpty.title}</h2>
          <p className="prose-muted mb-6">{COPY.cartEmpty.body}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop/lampshades" className="btn-primary">
              {COPY.cartEmpty.cta}
            </Link>
            <Link href="/design-your-shade" className="btn-secondary">
              Design a shade
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-[color:var(--line)] pb-6">
                <div className="relative h-28 w-24 bg-[color:var(--stone)] shrink-0">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.config && (
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      {item.config.shapeName} · {item.config.fabricName} · {item.config.sizeName}
                      <br />
                      {item.config.liningName} · {item.config.fittingName}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="qty-control">
                      <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p>{formatMoney(item.unitPrice * item.quantity)}</p>
                  </div>
                  <button type="button" className="text-xs underline mt-2 text-[color:var(--muted)]" onClick={() => remove(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="surface-panel p-6 md:p-8 h-fit space-y-3">
            <p className="eyebrow mb-2">Summary</p>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-xs text-muted">
              Shipping is calculated at checkout from studio rates.
            </p>
            <div className="divider my-2" />
            <div className="flex justify-between font-medium">
              <span>Estimated total</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-[10px] text-[color:var(--muted)]">Excludes shipping &amp; tax</p>
            <Link href="/checkout" className="btn-primary w-full mt-4">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
