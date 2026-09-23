import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";

export default function AboutPage() {
  return (
    <div className="container-site py-14">
      <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center mb-14">
        <div>
          <p className="eyebrow mb-2">{COPY.about.eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl mb-6">{COPY.about.title}</h1>
          <div className="space-y-5 prose-muted text-lg">
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
          <Image
            src="/media/homepage/story-craft.png"
            alt="Lumina Hub handmade lampshades in an interior"
            fill
            className="object-cover object-center"
            sizes="(max-width:768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 border-t border-[color:var(--line)] pt-12">
        {COPY.about.pillars.map((p) => (
          <div key={p.title}>
            <p className="eyebrow mb-2">{p.title}</p>
            <p className="prose-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-sm text-[color:var(--muted)]">
        Workshop · {SITE.address}
      </p>
    </div>
  );
}
