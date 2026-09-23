import type { Metadata } from "next";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

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
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">{COPY.care.eyebrow}</p>
      <h1 className="section-title mb-3">{COPY.care.title}</h1>
      <div className="lux-rule" />
      <p className="prose-muted text-lg mb-10">{COPY.care.intro}</p>

      <div className="space-y-10">
        {COPY.care.sections.map((section) => (
          <section key={section.title} className="border-t border-line pt-6">
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

      <p className="mt-12 text-sm text-muted">
        Unsure about a velvet, linen or foil finish?{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-bronze">
          Ask the studio
        </Link>
        {" · "}
        <Link href="/faq" className="underline underline-offset-4 hover:text-bronze">
          FAQ
        </Link>
        {" · "}
        <Link href="/shipping" className="underline underline-offset-4 hover:text-bronze">
          Shipping
        </Link>
      </p>
    </div>
  );
}
