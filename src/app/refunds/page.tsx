import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds & Returns",
  description: "Returns eligibility for made-to-order Lumina Hub lampshades.",
};

export default function RefundsPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Policies</p>
      <h1 className="font-display text-5xl mb-8">Refunds &amp; returns</h1>
      <div className="space-y-6 text-[color:var(--muted)] leading-relaxed">
        <p>
          Due to the handmade and custom nature of our products, the following returns policy
          applies.
        </p>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">
            Non-returnable items
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lamp shades with a diameter over 35cm</li>
            <li>Orders containing multiple shades</li>
            <li>Custom-made or made-to-order items</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">
            Returns eligibility
          </h2>
          <p>We only accept returns if:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>The item arrives damaged</li>
            <li>The wrong item was sent</li>
          </ul>
          <p className="mt-3">
            Contact us within 48 hours of delivery with photos of the issue.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Refunds</h2>
          <p>
            Once approved, refunds are processed to your original payment method
            within a few business days.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Exchanges</h2>
          <p>
            We do not offer exchanges due to the made-to-order nature of our
            products.
          </p>
        </section>
        <p className="text-sm">
          <Link href="/contact" className="underline">
            Contact the studio
          </Link>
        </p>
      </div>
    </div>
  );
}
