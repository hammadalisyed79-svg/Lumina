import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for shopping with Lumina Hub.",
};

export default function TermsPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Policies</p>
      <h1 className="font-display text-5xl mb-8">Terms of service</h1>
      <div className="space-y-6 text-[color:var(--muted)] leading-relaxed">
        <p>
          Welcome to Lumina Hub. By accessing or purchasing from our website,
          you agree to the following terms (source: luminahub.co.uk — verify
          before public launch).
        </p>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">1. General</h2>
          <p>
            By using our website, you confirm that you are at least the age of
            majority in your country or have permission to use this site. We
            reserve the right to update these terms.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">
            2. Products &amp; orders
          </h2>
          <p>
            All lamp shades are handmade and made to order; slight variations may
            occur in fabric, colour, or finish. Customers are responsible for
            ensuring size, shape and fitting details are correct before ordering.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">
            3. Pricing &amp; payments
          </h2>
          <p>
            Prices are listed in GBP (£) unless stated otherwise. Additional
            customs duties or taxes for international orders are the
            customer&apos;s responsibility.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">4. Product use</h2>
          <p>
            Use LED bulbs (max 10W recommended on the source site) and check
            fitting compatibility. We are not responsible for damage caused by
            incorrect use or installation.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">5. Contact</h2>
          <p>
            Email: sales@luminahub.co.uk · Hours: Mon–Sat, 10:00–18:00 (UK)
          </p>
        </section>
        <p className="text-sm">
          See also <Link href="/refunds" className="underline">Refunds</Link> and{" "}
          <Link href="/shipping" className="underline">Shipping</Link>.
        </p>
      </div>
    </div>
  );
}
