"use client";

import Image from "next/image";
import Link from "next/link";
import { HERO_IMAGE } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt="Lumina Hub handmade lampshades in a styled living room"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%] animate-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[100svh] flex items-end pb-16 sm:pb-24">
        <div className="max-w-xl text-white animate-fade-up drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
          <p className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl leading-[0.92] tracking-tight">
            Lumina Hub
          </p>
          <h1 className="mt-5 text-xl sm:text-2xl font-light tracking-wide text-white/95">
            Where light meets craftsmanship
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/85 max-w-md leading-relaxed">
            Handmade UK lampshades in velvet and bespoke prints — drum,
            rectangular, and more, sized for your space.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the collection
            </Link>
            <Link href="/about" className="btn-ghost">
              Our studio story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
