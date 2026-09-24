"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { EmptyState } from "@/components/commerce/EmptyState";

type CardProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  basePrice: number;
  imageUrl: string;
  hoverImageUrl?: string;
};

export function AccountWishlistGrid({ products }: { products: CardProduct[] }) {
  const { has, ids, replaceIds } = useWishlist();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const serverIds = products.map((p) => p.id);
    replaceIds(Array.from(new Set([...ids, ...serverIds])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from server payload
  }, []);

  const visible = products.filter((p) => has(p.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        eyebrow="Saved"
        title="No saved pieces yet"
        body="Tap the heart on a lampshade to keep it here. Hearts sync to your account when you are signed in."
        primary={{ href: "/shop/lampshades", label: "Browse lampshades" }}
        secondary={{ href: "/design-your-shade", label: "Design a shade" }}
      />
    );
  }

  return (
    <>
      <p className="text-sm text-muted mb-6">
        {visible.length} {visible.length === 1 ? "piece" : "pieces"} · Tap the heart to remove
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
        {visible.map((p) => (
          <div key={p.id} className="space-y-2">
            <ProductCard product={p} />
            <Link
              href={`/product/${p.slug}`}
              className="block text-center text-xs underline underline-offset-4 text-muted hover:text-bronze"
            >
              View product
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
