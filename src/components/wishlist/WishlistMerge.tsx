"use client";

import { useEffect } from "react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishlistMerge() {
  const { ids, mergeServer, clear } = useWishlist();

  useEffect(() => {
    if (ids.length === 0) return;
    fetch("/api/wishlist/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ids) {
          mergeServer(data.ids);
          // Keep local in sync with server after merge
        }
      })
      .catch(() => undefined);
  }, [ids, mergeServer, clear]);

  return null;
}
