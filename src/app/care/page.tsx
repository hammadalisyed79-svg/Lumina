import type { Metadata } from "next";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";
import { ContentCtas, ContentHero } from "@/components/content/ContentHero";

export const metadata: Metadata = {
  title: "Care",
  description: COPY.care.metaDescription,
  openGraph: {
    title: "Care for your shade | Lumina Hub",
    description: COPY.care.metaDescription,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function CarePage() {
  return (
    <div>
      <ContentHero
        eyebrow={COPY.care.eyebrow}
        title={COPY.care.title}
        subtitle={COPY.care.intro}
        image="/media/homepage/hero-lifestyle.png"
        alt="Lumina Hub lampshade in a considered interior"
        ctas={[
          { href: "/shop/lampshades", label: "Shop lampshades" },
          { href: "/design-your-shade", label: "Design your shade", variant: "secondary" },
        ]}
      />

      <div className="container-site section-pad max-w-3xl">
        <div className="lux-rule" />
        <div className="space-y-10">
          {COPY.care.sections.map((section) => (
            <section key={section.title} className="border-t border-line pt-6 first:border-0 first:pt-0">
              <h2 className="font-display text-2xl tracking-tight mb-3">{section.title}</h2>
              <ul className="space-y-2 prose-muted">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bronze" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <ContentCtas
          primary={{ href: "/contact", label: "Ask the studio" }}
          secondary={{ href: "/faq", label: "Read the FAQ", variant: "secondary" }}
          tertiary={{ href: "/shipping", label: "Shipping", variant: "quiet" }}
        />
        <p className="mt-6 text-sm text-muted">
          Looking for sizing help?{" "}
          <Link href="/size-guide" className="underline underline-offset-4 hover:text-bronze">
            Open the size guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
