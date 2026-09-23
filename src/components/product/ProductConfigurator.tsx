"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";

type CatalogVariant = {
  id: string;
  title: string;
  sku: string;
  priceOverride: number | null;
  shopifyVariantId: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  active: boolean;
};

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    basePrice: number;
    imageUrl?: string;
    configEnabled: boolean;
    type: string;
    shapeKey?: string | null;
    variants: CatalogVariant[];
  };
};

/** Purchasable options use local catalog prices — independent of Shopify. */
export function ProductConfigurator({ product }: Props) {
  const { addProduct } = useCart();
  const purchasable = useMemo(
    () => product.variants.filter((v) => v.active),
    [product.variants]
  );

  const [variantId, setVariantId] = useState(purchasable[0]?.id || "");
  const [qty, setQty] = useState(1);

  const selected = purchasable.find((v) => v.id === variantId) || purchasable[0];
  const unitPrice = selected?.priceOverride ?? product.basePrice;

  const option1Values = useMemo(() => {
    const set = new Set<string>();
    for (const v of purchasable) {
      if (v.option1) set.add(v.option1);
    }
    return [...set];
  }, [purchasable]);

  const [option1, setOption1] = useState(purchasable[0]?.option1 || "");

  const filteredByOption1 = useMemo(() => {
    if (!option1 || option1Values.length <= 1) return purchasable;
    const matched = purchasable.filter((v) => v.option1 === option1);
    return matched.length ? matched : purchasable;
  }, [purchasable, option1, option1Values.length]);

  function onSelectOption1(value: string) {
    setOption1(value);
    const next = purchasable.find((v) => v.option1 === value);
    if (next) setVariantId(next.id);
  }

  function add() {
    if (!selected) return;
    addProduct({
      productId: product.id,
      variantId: selected.id,
      slug: product.slug,
      title:
        selected.title && selected.title !== "Default Title"
          ? `${product.title} · ${selected.title}`
          : product.title,
      imageUrl: product.imageUrl,
      quantity: qty,
      unitPrice,
    });
  }

  if (!purchasable.length) {
    return (
      <div className="border-t border-[color:var(--line)] pt-6 space-y-3">
        <p className="text-sm text-[color:var(--muted)]">
          This product has no active options yet. Contact the studio to order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 border-t border-[color:var(--line)] pt-6">
      {option1Values.length > 1 && (
        <label className="block space-y-2">
          <span className="label">Option</span>
          <select
            className="input"
            value={option1 || ""}
            onChange={(e) => onSelectOption1(e.target.value)}
          >
            {option1Values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block space-y-2">
        <span className="label">Variant</span>
        <select
          className="input"
          value={selected?.id || ""}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {filteredByOption1.slice(0, 200).map((v) => (
            <option key={v.id} value={v.id}>
              {v.title === "Default Title" ? "Standard" : v.title}
              {v.priceOverride != null ? ` — ${formatMoney(v.priceOverride)}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-4">
        <div>
          <span className="label">Quantity</span>
          <div className="qty-control">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
        <p className="font-medium">{formatMoney(unitPrice)}</p>
      </div>

      <button type="button" className="btn-primary w-full md:w-auto" onClick={add} disabled={!selected}>
        Add to bag
      </button>
      <p className="text-xs text-[color:var(--muted)]">
        Secure payment with Stripe. Shipping is calculated at checkout from your studio rates.
      </p>
    </div>
  );
}
