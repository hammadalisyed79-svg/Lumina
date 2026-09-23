import Link from "next/link";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import { NewsletterForm } from "@/components/home/NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-charcoal text-ivory">
      <div className="container-site section-pad grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-4xl mb-4 tracking-tight">{SITE.name}</p>
          <p className="text-ivory/70 max-w-md leading-relaxed">{COPY.footer.blurb}</p>
          <ul className="mt-6 space-y-2 text-sm text-ivory/65">
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-champagne transition-colors">
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="hover:text-champagne transition-colors"
              >
                {SITE.phone}
              </a>
            </li>
            <li>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-champagne transition-colors"
              >
                WhatsApp the studio
              </a>
            </li>
            <li className="pt-1">{SITE.address}</li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow text-champagne mb-5">Shop</p>
          <ul className="space-y-2.5 text-[15px] text-ivory/80">
            <li>
              <Link href="/shop/lampshades" className="hover:text-ivory">
                Lampshades
              </Link>
            </li>
            <li>
              <Link href="/shop/fabrics" className="hover:text-ivory">
                Fabrics
              </Link>
            </li>
            <li>
              <Link href="/shop/cushions" className="hover:text-ivory">
                Cushions
              </Link>
            </li>
            <li>
              <Link href="/shop/kits" className="hover:text-ivory">
                Kits
              </Link>
            </li>
            <li>
              <Link href="/design-your-shade" className="hover:text-ivory">
                Design your shade
              </Link>
            </li>
            <li>
              <Link href="/size-guide" className="hover:text-ivory">
                Size guide
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow text-champagne mb-5">Studio</p>
          <ul className="space-y-2.5 text-[15px] text-ivory/80">
            <li>
              <Link href="/about" className="hover:text-ivory">
                About
              </Link>
            </li>
            <li>
              <Link href="/craft" className="hover:text-ivory">
                Craft
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-ivory">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/care" className="hover:text-ivory">
                Care
              </Link>
            </li>
            <li>
              <Link href="/trade" className="hover:text-ivory">
                Trade
              </Link>
            </li>
            <li>
              <Link href="/bespoke" className="hover:text-ivory">
                Bespoke
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-ivory">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="eyebrow text-champagne mb-5">{COPY.footer.newsletter}</p>
          <p className="text-sm text-ivory/65 mb-4 leading-relaxed">
            Occasional notes on fabrics, forms and studio news.
          </p>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="container-site py-6 border-t border-white/10 flex flex-col md:flex-row gap-3 justify-between text-sm text-ivory/50">
        <p>
          © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/shipping" className="hover:text-ivory">
            Shipping
          </Link>
          <Link href="/refunds" className="hover:text-ivory">
            Refunds
          </Link>
          <Link href="/privacy" className="hover:text-ivory">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ivory">
            Terms
          </Link>
          <span>Made in Britain</span>
        </div>
      </div>
    </footer>
  );
}
