import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import { ContentCtas, ContentHero } from "@/components/content/ContentHero";

export default function AboutPage() {
  return (
    <div>
      <ContentHero
        eyebrow={COPY.about.eyebrow}
        title={COPY.about.title}
        subtitle={COPY.about.p1}
        image="/media/homepage/hero-lifestyle.png"
        alt="Lumina Hub handmade lampshades in an interior"
        ctas={[
          { href: "/shop/lampshades", label: "Explore lampshades" },
          { href: "/design-your-shade", label: "Design your shade", variant: "secondary" },
        ]}
      />

      <div className="container-site section-pad">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-20 max-w-5xl">
          <div>
            <p className="eyebrow mb-3">Workshop</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-3">
              Made by hand in Ilford
            </h2>
            <div className="lux-rule" />
            <p className="prose-muted">{COPY.about.p2}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/craft" className="btn-secondary">
                How we think about light
              </Link>
              <Link href="/trade" className="btn-quiet">
                Trade partners
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-stone">
            <MediaImage
              src="/media/homepage/story-craft.png"
              alt="Lumina Hub studio craftsmanship"
              fill
              className="object-cover object-center"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-10 border-t border-line pt-12 md:pt-16">
          {COPY.about.pillars.map((p) => (
            <div key={p.title} className="surface-panel p-6 md:p-8">
              <p className="eyebrow mb-3 text-bronze">{p.title}</p>
              <div className="lux-rule !mt-0 !mb-4" />
              <p className="prose-muted text-[15px]">{p.body}</p>
            </div>
          ))}
        </div>

        <ContentCtas
          primary={{ href: "/shop/lampshades", label: "Explore lampshades" }}
          secondary={{ href: "/design-your-shade", label: "Design your shade", variant: "secondary" }}
          tertiary={{ href: "/contact", label: "Contact the studio", variant: "quiet" }}
        />

        <p className="mt-10 text-sm text-muted">Workshop · {SITE.address}</p>
      </div>
    </div>
  );
}
