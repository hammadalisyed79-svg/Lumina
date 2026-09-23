import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Made-to-order production and delivery for Lumina Hub lampshades.",
};

export default function ShippingPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Policies</p>
      <h1 className="font-display text-5xl mb-8">Shipping</h1>
      <div className="prose-lumina space-y-6 text-[color:var(--muted)] leading-relaxed">
        <p>
          Each Lumina Hub lampshade is handmade to order with care. Production and delivery times
          below are typical; exact shipping options appear at checkout once online payment is
          connected.
        </p>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Processing time</h2>
          <p>
            Please allow 2–4 business days for production before dispatch, unless a longer lead
            time is shown on the product.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Delivery times</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>UK mainland: typically 2–4 business days after dispatch</li>
            <li>International: approximately 5–7 business days after dispatch where offered</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Shipping costs</h2>
          <p>
            Costs are calculated at checkout from destination and parcel size. Large shades may
            require specialist packaging.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Tracking</h2>
          <p>
            Once dispatched, you receive confirmation with tracking details where the carrier
            provides them.
          </p>
        </section>
        <p className="text-sm">
          Questions?{" "}
          <Link href="/contact" className="underline">
            Contact the studio
          </Link>{" "}
          or WhatsApp{" "}
          <a href={SITE.whatsapp} className="underline" target="_blank" rel="noopener noreferrer">
            {SITE.phone}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
