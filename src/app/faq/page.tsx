import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Lumina Hub lampshades.",
};

const FAQS = [
  {
    q: "Are shades made to order?",
    a: "Yes. Most lampshades are handmade to order in the UK. Lead times are shown on product pages and typically allow a few business days for production before dispatch.",
  },
  {
    q: "How do I choose size and fitting?",
    a: "Use our Size & Fitting guide, confirm centimetre measurements, and note pendant versus table/floor fittings. Add notes at checkout if you need a specific washer set.",
  },
  {
    q: "Can I return a shade?",
    a: "Due to made-to-order production, many items are non-returnable (including shades over 35cm and multi-shade orders). Damaged or incorrect items should be reported within 48 hours of delivery with photos.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, where offered at checkout. International delivery times and any customs charges are outlined in Shipping and Terms.",
  },
  {
    q: "Can I order fabric or a cushion to match?",
    a: "Many patterns are available as fabric and cushion covers. Browse Fabrics and Cushions, or contact us for matching advice.",
  },
  {
    q: "Why can’t I complete checkout yet?",
    a: "Online payment reconnects when Shopify Storefront credentials are configured. Until then you can browse, save wishlists and designs, and enquire via Contact, WhatsApp or Bespoke.",
  },
  {
    q: "Can I design my own shade?",
    a: "Yes — use Design your shade to explore shape, fabric, size, lining and fitting. Save the design to your account or send an enquiry while purchasing is being connected.",
  },
  {
    q: "Do you work with interior designers?",
    a: "Yes. Apply via the Trade programme for project support and priority communication.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Help</p>
      <h1 className="font-display text-5xl mb-8">FAQ</h1>
      <div className="space-y-8">
        {FAQS.map((item) => (
          <section key={item.q}>
            <h2 className="font-display text-2xl text-[color:var(--ink)] mb-2">{item.q}</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">{item.a}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-[color:var(--muted)]">
        Still unsure?{" "}
        <Link href="/contact" className="underline">
          Contact us
        </Link>{" "}
        or read the{" "}
        <Link href="/size-guide" className="underline">
          size guide
        </Link>
        .
      </p>
    </div>
  );
}
