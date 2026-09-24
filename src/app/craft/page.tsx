import type { Metadata } from "next";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";
import { ContentCtas, ContentHero } from "@/components/content/ContentHero";

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
      <ContentHero
        eyebrow={COPY.craft.eyebrow}
        title={COPY.craft.title}
        subtitle={COPY.craft.paragraphs[0]}
        image="/media/homepage/story-craft.png"
        alt="Handmade lampshade craftsmanship at Lumina Hub"
        ctas={[
          { href: "/design-your-shade", label: "Design your shade" },
          { href: "/shop/lampshades", label: "Shop lampshades", variant: "secondary" },
        ]}
      />

      <div className="container-site section-pad max-w-3xl">
        <div className="lux-rule" />
        <div className="space-y-6 prose-muted text-lg">
          {COPY.craft.paragraphs.slice(1).map((p) => (
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

        <ContentCtas
          primary={{ href: "/design-your-shade", label: "Design your shade" }}
          secondary={{ href: "/shop/lampshades", label: "Shop lampshades", variant: "secondary" }}
          tertiary={{ href: "/about", label: "Our story", variant: "quiet" }}
        />
        <p className="mt-8 text-sm text-muted">
          Also explore{" "}
          <Link href="/care" className="underline underline-offset-4 hover:text-bronze">
            care notes
          </Link>{" "}
          and the{" "}
          <Link href="/size-guide" className="underline underline-offset-4 hover:text-bronze">
            size guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
