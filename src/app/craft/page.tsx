import type { Metadata } from "next";
import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: COPY.craft.title,
  description: COPY.craft.metaDescription,
  openGraph: {
    title: `${COPY.craft.title} | Lumina Hub`,
    description: COPY.craft.metaDescription,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function CraftPage() {
  return (
    <div>
      <div className="relative min-h-[48vh] md:min-h-[56vh] flex items-end overflow-hidden bg-ink">
        <MediaImage
          src="/media/homepage/story-craft.png"
          alt="Handmade lampshade craftsmanship at Lumina Hub"
          fill
          className="object-cover object-center opacity-90"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,17,14,0.75)] via-[rgba(20,17,14,0.25)] to-transparent" />
        <div className="relative container-site py-14 md:py-20 text-white max-w-3xl">
          <p className="eyebrow text-champagne mb-3">{COPY.craft.eyebrow}</p>
          <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95]">
            {COPY.craft.title}
          </h1>
        </div>
      </div>

      <div className="container-site section-pad max-w-3xl">
        <div className="lux-rule" />
        <div className="space-y-6 prose-muted text-lg">
          {COPY.craft.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-14 pt-12 border-t border-line">
          {COPY.craft.pillars.map((p) => (
            <div key={p.title}>
              <p className="eyebrow mb-2">{p.title}</p>
              <p className="prose-muted text-sm">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-12">
          <Link href="/design-your-shade" className="btn-primary">
            Design your shade
          </Link>
          <Link href="/shop/lampshades" className="btn-secondary">
            Shop lampshades
          </Link>
          <Link href="/about" className="btn-quiet">
            Our story
          </Link>
        </div>
      </div>
    </div>
  );
}
