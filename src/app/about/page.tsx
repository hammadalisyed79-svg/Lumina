import { MediaImage } from "@/components/media/MediaImage";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";

export default function AboutPage() {
  return (
    <div className="container-site section-pad">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-20">
        <div>
          <p className="eyebrow mb-3">{COPY.about.eyebrow}</p>
          <h1 className="section-title mb-3">{COPY.about.title}</h1>
          <div className="lux-rule" />
          <div className="space-y-5 prose-muted">
            <p>{COPY.about.p1}</p>
            <p>{COPY.about.p2}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop/lampshades" className="btn-primary">
              Explore lampshades
            </Link>
            <Link href="/design-your-shade" className="btn-secondary">
              Design your shade
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--stone)]">
          <MediaImage
            src="/media/homepage/story-craft.png"
            alt="Lumina Hub handmade lampshades in an interior"
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

      <p className="mt-12 text-sm text-[color:var(--muted)]">
        Workshop · {SITE.address}
      </p>
    </div>
  );
}
