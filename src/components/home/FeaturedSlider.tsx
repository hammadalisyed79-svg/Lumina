"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";

export function FeaturedSlider({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 flex gap-2">
        <button type="button" aria-label="Previous" className="p-2 border border-line text-ink transition-colors hover:border-bronze hover:text-bronze" onClick={() => scroll(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="Next" className="p-2 border border-line text-ink transition-colors hover:border-bronze hover:text-bronze" onClick={() => scroll(1)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => (
          <div key={p.id} className="min-w-[240px] md:min-w-[280px] snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
