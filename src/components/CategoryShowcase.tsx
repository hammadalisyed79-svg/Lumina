import Image from "next/image";
import Link from "next/link";
import { CATEGORY_IMAGES } from "@/lib/site";

const SHOWCASE = ["Drum", "Rectangular", "Oval", "Square", "Fabric", "Cushion Covers"] as const;

export function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl mb-12">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
          Shop by form
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--ink)] leading-tight">
          Every silhouette, ready to glow
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {SHOWCASE.map((name, i) => (
          <Link
            key={name}
            href={`/shop?category=${encodeURIComponent(name)}`}
            className={`group relative overflow-hidden bg-[var(--stone)] ${
              i === 0 ? "sm:col-span-2 sm:aspect-[16/9] aspect-[4/5]" : "aspect-[4/5]"
            }`}
          >
            <Image
              src={CATEGORY_IMAGES[name]}
              alt={name}
              fill
              sizes="(max-width:768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-6 text-white">
              <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">
                {name}
              </h3>
              <span className="text-xs uppercase tracking-[0.18em] text-white/80 mt-1 inline-block opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
