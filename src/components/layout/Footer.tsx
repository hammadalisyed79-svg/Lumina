import Link from "next/link";
import { SITE } from "@/lib/site";
import { NewsletterForm } from "@/components/home/NewsletterForm";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--stone)]/40 mt-16">
      <div className="container-site section-pad grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl mb-3">{SITE.name}</p>
          <p className="prose-muted max-w-md">
            Handmade lampshades and interior textiles, made to order in Britain. Quiet materials,
            considered proportions, lasting light.
          </p>
          <div className="mt-8 max-w-md">
            <p className="eyebrow mb-3">Newsletter</p>
            <NewsletterForm />
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-[15px]">
            <li><Link href="/shop/lampshades">Lampshades</Link></li>
            <li><Link href="/shop/fabrics">Fabrics</Link></li>
            <li><Link href="/shop/cushions">Cushions</Link></li>
            <li><Link href="/design-your-shade">Design your shade</Link></li>
            <li><Link href="/size-guide">Size guide</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Studio</p>
          <ul className="space-y-2 text-[15px]">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/trade">Trade</Link></li>
            <li><Link href="/bespoke">Bespoke</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="container-site py-6 border-t border-[color:var(--line)] flex flex-col md:flex-row gap-3 justify-between text-sm text-[color:var(--muted)]">
        <p>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</p>
        <p>Made in the United Kingdom</p>
      </div>
    </footer>
  );
}
