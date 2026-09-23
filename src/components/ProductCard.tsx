"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatGBP } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group block product-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--stone)]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-sm">
            No image
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="pt-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brass)]">
          {product.category}
        </p>
        <h3 className="text-sm leading-snug text-[var(--ink)] line-clamp-2 group-hover:text-[var(--brass)] transition-colors">
          {product.title}
        </h3>
        <p className="text-sm font-medium text-[var(--ink)]">
          {formatGBP(product.price)}
        </p>
      </div>
    </Link>
  );
}
