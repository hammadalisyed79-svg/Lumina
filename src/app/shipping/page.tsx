import type { Metadata } from "next";
import Link from "next/link";

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
          At Lumina Hub, each lampshade is handmade to order with care and precision.
          Source reference: luminahub.co.uk shipping policy (verify final rates with the
          business before public launch).
        </p>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Processing time</h2>
          <p>
            All orders are made to order. Please allow 2–4 business days for production
            before dispatch, unless a longer lead time is shown on the product.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Delivery times</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>UK: typically 2–4 business days after dispatch</li>
            <li>International: approximately 5–7 business days after dispatch</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Shipping costs</h2>
          <p>
            Shipping costs are calculated at checkout based on your location and order
            size. Do not treat any homepage announcement as a guarantee until confirmed
            in Shopify shipping settings.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">Tracking</h2>
          <p>
            Once your order is dispatched, you will receive a confirmation email with
            tracking details where the carrier provides them.
          </p>
        </section>
        <p className="text-sm">
          Questions? <Link href="/contact" className="underline">Contact the studio</Link>.
        </p>
      </div>
    </div>
  );
}
