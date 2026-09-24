"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart, mergeLines } from "@/components/cart/CartProvider";
import type { CartLine } from "@/lib/cart/types";

/** Merge guest localStorage bag into signed-in server cart (and back). */
export function CartMerge() {
  const { status } = useSession();
  const { items, hydrated, replaceItems } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !hydrated || ran.current) return;
    ran.current = true;

    fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          replaceItems(data.items as CartLine[]);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once after auth hydrate
  }, [status, hydrated]);

  return null;
}

export { mergeLines };
