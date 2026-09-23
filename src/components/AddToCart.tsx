"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function onAdd() {
    addItem(
      {
        handle: product.handle,
        title: product.title,
        price: product.price,
        image: product.image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center border border-[var(--line)] bg-white">
        <button
          type="button"
          className="w-10 h-11 text-lg"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease"
        >
          −
        </button>
        <span className="w-10 text-center text-sm">{qty}</span>
        <button
          type="button"
          className="w-10 h-11 text-lg"
          onClick={() => setQty((q) => Math.min(20, q + 1))}
          aria-label="Increase"
        >
          +
        </button>
      </div>
      <button type="button" onClick={onAdd} className="btn-primary min-w-44">
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </div>
  );
}
