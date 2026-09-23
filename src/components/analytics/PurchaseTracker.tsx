"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/analytics";

export function PurchaseTracker({
  orderNumber,
  value,
  items,
  fire,
}: {
  orderNumber: string;
  value: number;
  items: { item_id?: string; item_name: string; price: number; quantity: number }[];
  fire: boolean;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (!fire || sent.current) return;
    sent.current = true;
    const key = `lh_purchase_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    trackPurchase({
      transaction_id: orderNumber,
      value,
      items,
    });
  }, [fire, orderNumber, value, items]);

  return null;
}
