"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function HeaderActions() {
  const { count, setDrawerOpen } = useCart();
  const { ids } = useWishlist();

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <button
        type="button"
        aria-label="Open search"
        className="p-1.5 hover:text-[color:var(--bronze)]"
        onClick={() => window.dispatchEvent(new CustomEvent("lumina:search-open"))}
      >
        <Search size={20} strokeWidth={1.5} />
      </button>
      <Link href="/account" aria-label="Account" className="p-1.5 hover:text-[color:var(--bronze)]">
        <User size={20} strokeWidth={1.5} />
      </Link>
      <Link href="/wishlist" aria-label="Wishlist" className="relative p-1.5 hover:text-[color:var(--bronze)]">
        <Heart size={20} strokeWidth={1.5} />
        {ids.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[color:var(--bronze)] text-[10px] text-[color:var(--ink)] flex items-center justify-center px-1">
            {ids.length}
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label="Open cart"
        className="relative p-1.5 hover:text-[color:var(--bronze)]"
        onClick={() => setDrawerOpen(true)}
      >
        <ShoppingBag size={20} strokeWidth={1.5} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[color:var(--bronze)] text-[10px] text-[color:var(--ink)] flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
