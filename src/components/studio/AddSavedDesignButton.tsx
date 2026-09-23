"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { ShadeConfig } from "@/lib/cart/types";

export function AddSavedDesignButton({
  title,
  imageUrl,
  config,
}: {
  title: string;
  imageUrl?: string | null;
  config: ShadeConfig;
}) {
  const { addConfigured } = useCart();

  return (
    <button
      type="button"
      className="btn-primary text-sm"
      onClick={() =>
        addConfigured({
          title,
          imageUrl: imageUrl || undefined,
          quantity: 1,
          config,
        })
      }
    >
      Add to bag
    </button>
  );
}
