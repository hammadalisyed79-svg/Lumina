"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { formatMoney, shortDisplayTitle } from "@/lib/utils";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { MediaImage } from "@/components/media/MediaImage";

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
  const hasHover = Boolean(product.hoverImageUrl);

  return (
    <article className="group">
      <div className="relative aspect-[4/5] bg-stone overflow-hidden">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          <MediaImage
            src={product.imageUrl}
            alt={product.title}
            fill
            className={`object-cover img-zoom transition-opacity duration-700 ${
              hasHover ? "group-hover:opacity-0" : ""
            }`}
            sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
          />
          {hasHover && (
            <MediaImage
              src={product.hoverImageUrl!}
              alt=""
              fill
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
            />
          )}
        </Link>
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-[1] flex h-9 w-9 items-center justify-center bg-ivory/95 text-ink transition-colors hover:bg-white"
          onClick={() => toggle(product.id)}
        >
          <Heart
            size={15}
            strokeWidth={1.5}
            className={wished ? "fill-bronze text-bronze" : ""}
          />
        </button>
      </div>
      <div className="mt-3.5 space-y-1">
        <Link
          href={`/product/${product.slug}`}
          className="block font-medium leading-snug tracking-tight transition-colors hover:text-bronze"
        >
          {shortDisplayTitle(product.title)}
        </Link>
        {product.subtitle && (
          <p className="text-sm text-muted line-clamp-1">{product.subtitle}</p>
        )}
        <p className="text-sm text-muted pt-0.5">From {formatMoney(product.basePrice)}</p>
      </div>
    </article>
  );
}
