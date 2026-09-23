"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, [ids]);

  return (
    <div className="container-site py-12">
      <h1 className="font-display text-4xl mb-3">Wishlist</h1>
      <p className="prose-muted mb-8">
        Saved on this device.{" "}
        <Link href="/account/login" className="underline">
          Sign in
        </Link>{" "}
        to sync across sessions.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="prose-muted">No saved pieces yet.</p>}
    </div>
  );
}
