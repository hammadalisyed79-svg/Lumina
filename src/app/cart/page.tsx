"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";
import { SITE } from "@/lib/site";

export default function CartPage() {
  const { items, subtotal, updateQty, remove } = useCart();
  const shippingEstimate =
    subtotal >= SITE.freeShippingFrom ? 0 : SITE.defaultShipping;

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl mb-8">Shopping bag</h1>
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="prose-muted mb-6">Your bag is empty.</p>
          <Link href="/shop/lampshades" className="btn-primary">
            Shop lampshades
          </Link>
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
                    <pre className="text-xs text-[color:var(--muted)] mt-2 whitespace-pre-wrap font-sans">
                      {item.config.shapeName} · {item.config.fabricName} · {item.config.sizeName}
                      {"\n"}
                      {item.config.liningName} · {item.config.fittingName}
                    </pre>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-[color:var(--line)]">
                      <button type="button" className="px-3 py-1" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                      <span className="px-2">{item.quantity}</span>
                      <button type="button" className="px-3 py-1" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
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
          <aside className="border border-[color:var(--line)] p-6 h-fit bg-white/60 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Est. shipping</span>
              <span>{shippingEstimate === 0 ? "Complimentary" : formatMoney(shippingEstimate)}</span>
            </div>
            <div className="divider my-2" />
            <div className="flex justify-between font-medium">
              <span>Estimated total</span>
              <span>{formatMoney(subtotal + shippingEstimate)}</span>
            </div>
            <Link href="/checkout" className="btn-primary w-full mt-4">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
