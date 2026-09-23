"use client";

import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";

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
              <div key={item.id} className="flex gap-4 border-b border-line pb-6">
                <div className="relative h-28 w-24 bg-stone shrink-0">
                  {item.imageUrl && (
                    <MediaImage
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.config && (
                    <p className="text-xs text-muted mt-2 leading-relaxed">
                      {item.config.shapeName} · {item.config.fabricName} · {item.config.sizeName}
                      <br />
                      {item.config.liningName} · {item.config.fittingName}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="qty-control">
                      <button type="button" aria-label="Decrease" onClick={() => updateQty(item.id, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label="Increase" onClick={() => updateQty(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <p>{formatMoney(item.unitPrice * item.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs underline mt-2 text-muted hover:text-bronze"
                    onClick={() => remove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="surface-panel p-6 md:p-8 h-fit space-y-4">
            <p className="eyebrow mb-1">Summary</p>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between font-medium">
              <span>Estimated total</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-[10px] text-muted">Excludes shipping &amp; tax</p>
            <CommerceTrust compact />
            <Link href="/checkout" className="btn-primary w-full mt-2">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
