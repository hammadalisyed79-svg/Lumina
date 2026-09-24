import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import { ContentCtas } from "@/components/content/ContentHero";

export const metadata: Metadata = {
  title: COPY.shippingPage.title,
  description: COPY.shippingPage.metaDescription,
};

export default function ShippingPage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">{COPY.shippingPage.eyebrow}</p>
      <h1 className="section-title mb-3">{COPY.shippingPage.title}</h1>
      <div className="lux-rule" />
      <p className="prose-muted text-lg mb-10">{COPY.shippingPage.intro}</p>

      <div className="space-y-10">
        {COPY.shippingPage.sections.map((section) => (
          <section key={section.title} className="border-t border-line pt-6">
            <h2 className="font-display text-2xl tracking-tight mb-3">{section.title}</h2>
            {"body" in section && section.body && (
              <p className="prose-muted leading-relaxed">{section.body}</p>
            )}
            {"points" in section && section.points && (
              <ul className="space-y-2 prose-muted">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bronze" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <ContentCtas
        primary={{ href: "/shop/lampshades", label: "Shop lampshades" }}
        secondary={{ href: "/care", label: "Care notes", variant: "secondary" }}
        tertiary={{ href: "/faq", label: "FAQ", variant: "quiet" }}
      />

      <p className="mt-8 text-sm text-muted">
        Questions?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-bronze">
          Contact the studio
        </Link>{" "}
        or WhatsApp{" "}
        <a
          href={SITE.whatsapp}
          className="underline underline-offset-4 hover:text-bronze"
          target="_blank"
          rel="noopener noreferrer"
        >
          {SITE.phone}
        </a>
        .
      </p>
    </div>
  );
}
