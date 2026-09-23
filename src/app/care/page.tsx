import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Care",
  description: "Care guidance for handmade lampshades and fabrics.",
};

export default function CarePage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Guidance</p>
      <h1 className="font-display text-5xl mb-8">Care</h1>
      <div className="space-y-6 text-[color:var(--muted)] leading-relaxed">
        <p>
          Handmade shades and printed textiles benefit from gentle handling.
          Always follow product-specific notes on the product page when
          provided.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Dust with a soft, dry cloth or soft brush.</li>
          <li>Avoid water, steam and abrasive cleaners on fabric and foil linings.</li>
          <li>Prefer LED bulbs within the wattage guidance on the product or Terms page.</li>
          <li>Keep shades clear of open flames and heaters.</li>
        </ul>
        <p className="text-sm">
          Need advice for a specific fabric?{" "}
          <Link href="/contact" className="underline">
            Ask the studio
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
