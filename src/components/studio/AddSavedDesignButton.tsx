"use client";

import { useState } from "react";
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
  const { addConfigured, setDrawerOpen } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="btn-primary text-sm"
      onClick={() => {
        addConfigured({
          title,
          imageUrl: imageUrl || undefined,
          quantity: 1,
          config,
        });
        setDrawerOpen(true);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? "In bag" : "Add to bag"}
    </button>
  );
}
