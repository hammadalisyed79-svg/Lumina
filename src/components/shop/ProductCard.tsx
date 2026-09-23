"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  basePrice: number | string;
  imageUrl: string;
  hoverImageUrl?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  return (
    <article className="group">
      <div className="relative aspect-[4/5] bg-[color:var(--stone)] overflow-hidden">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
            sizes="(max-width:768px) 50vw, 25vw"
          />
          {product.hoverImageUrl && (
            <Image
              src={product.hoverImageUrl}
              alt=""
              fill
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          )}
        </Link>
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 p-2 bg-[color:var(--ivory)]/90 hover:bg-white"
          onClick={() => toggle(product.id)}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            className={wished ? "fill-[color:var(--bronze)] text-[color:var(--bronze)]" : ""}
          />
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <Link href={`/product/${product.slug}`} className="font-medium leading-snug block">
          {product.title}
        </Link>
        {product.subtitle && (
          <p className="text-sm text-[color:var(--muted)]">{product.subtitle}</p>
        )}
        <p className="text-sm">From {formatMoney(product.basePrice)}</p>
      </div>
    </article>
  );
}
