"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

export function ProductViewTracker({
  itemId,
  itemName,
  price,
}: {
  itemId: string;
  itemName: string;
  price: number;
}) {
  useEffect(() => {
    trackViewItem({ item_id: itemId, item_name: itemName, price });
  }, [itemId, itemName, price]);

  return null;
}
