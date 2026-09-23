"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function HeaderActions() {
  const { count, setDrawerOpen } = useCart();
  const { ids } = useWishlist();

  return (
    <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 text-ink shrink-0">
      <button
        type="button"
        aria-label="Open search"
        className="flex h-10 w-10 items-center justify-center hover:text-bronze"
        onClick={() => window.dispatchEvent(new CustomEvent("lumina:search-open"))}
      >
        <Search size={20} strokeWidth={1.75} />
      </button>
      <Link
        href="/account"
        aria-label="Account"
        className="hidden sm:flex h-10 w-10 items-center justify-center hover:text-bronze"
      >
        <User size={20} strokeWidth={1.75} />
      </Link>
      <Link
        href="/wishlist"
        aria-label="Wishlist"
        className="relative flex h-10 w-10 items-center justify-center hover:text-bronze"
      >
        <Heart size={20} strokeWidth={1.75} />
        {ids.length > 0 && (
          <span className="absolute top-1 right-0.5 h-4 min-w-4 rounded-full bg-bronze text-[10px] text-ink flex items-center justify-center px-1">
            {ids.length}
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label="Open cart"
        className="relative flex h-10 w-10 items-center justify-center hover:text-bronze"
        onClick={() => setDrawerOpen(true)}
      >
        <ShoppingBag size={20} strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-1 right-0.5 h-4 min-w-4 rounded-full bg-bronze text-[10px] text-ink flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
