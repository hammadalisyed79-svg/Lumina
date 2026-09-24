"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatMoney } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";

export default function CartPage() {
  const { items, subtotal } = useCart();

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
            <Link href="/shop/lampshades" className="btn-quiet w-full text-center text-sm">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
