import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Care",
  description: "How to care for handmade Lumina Hub lampshades and textiles.",
};

export default function CarePage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Longevity</p>
      <h1 className="font-display text-5xl mb-4">Care for your shade</h1>
      <p className="prose-muted text-lg mb-8">
        A little gentleness keeps fabric, foil and frame looking considered for years. Follow any
        notes on the product page for special finishes.
      </p>
      <div className="space-y-6 text-[color:var(--muted)] leading-relaxed">
        <ul className="list-disc pl-5 space-y-2">
          <li>Dust with a soft, dry cloth or soft brush — never scrub.</li>
          <li>Keep water, steam and abrasive cleaners away from fabric and foil linings.</li>
          <li>Prefer LED bulbs within the guidance on the product or Terms page.</li>
          <li>Keep shades clear of open flames, heaters and direct midday sun when possible.</li>
        </ul>
        <p className="text-sm">
          Unsure about a velvet, linen or foil finish?{" "}
          <Link href="/contact" className="underline">
            Ask the studio
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
