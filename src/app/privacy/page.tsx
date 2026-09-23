import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lumina Hub handles personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Policies</p>
      <h1 className="font-display text-5xl mb-8">Privacy policy</h1>
      <div className="space-y-6 text-[color:var(--muted)] leading-relaxed">
        <p className="text-sm">Last updated reference: 9 July 2026 (source: luminahub.co.uk).</p>
        <p>
          Lumina Hub operates this store to provide a curated shopping experience.
          We collect contact, order, device and usage information to fulfil
          orders, provide support, improve the Services, and meet legal
          obligations. Payment processing is handled by our commerce provider
          (Shopify when live checkout is connected).
        </p>
        <section>
          <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">
            Contact for privacy requests
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: Sales@luminahub.co.uk</li>
            <li>Phone: +44 7889 451166</li>
            <li>Address: Electric Parade, Seven Kings, Ilford IG3 8BS, United Kingdom</li>
          </ul>
        </section>
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete or port personal information, and to object to certain
          processing. Contact us to exercise those rights. Full Shopify-hosted
          privacy text remains the legal source until counsel reviews the
          headless storefront wording.
        </p>
        <p className="text-sm">
          <Link href="/contact" className="underline">
            Contact
          </Link>
        </p>
      </div>
    </div>
  );
}
