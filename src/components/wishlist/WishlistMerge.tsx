"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

/** Sync local wishlist with the signed-in account (push local, then adopt server list). */
export function WishlistMerge() {
  const { status } = useSession();
  const { ids, replaceIds } = useWishlist();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || ran.current) return;
    ran.current = true;

    fetch("/api/wishlist/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.ids)) replaceIds(data.ids);
      })
      .catch(() => undefined);
    // Intentionally once after auth + local hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return null;
}
