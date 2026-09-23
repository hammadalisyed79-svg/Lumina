import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="container-site py-14">
      <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center mb-14">
        <div>
          <p className="eyebrow mb-2">Studio</p>
          <h1 className="font-display text-4xl md:text-5xl mb-6">Our story of light &amp; texture</h1>
          <div className="space-y-5 prose-muted text-lg">
            <p>
              Lumina Hub is a British lampshade and interior textile studio. We craft shades one
              piece at a time — choosing frames for proportion, fabrics for grain and light, and
              linings for warmth or clarity.
            </p>
            <p>
              From quiet linen drums to evening velvets and bespoke prints, every piece is
              stretched, trimmed and inspected by hand before it leaves the workshop in Ilford.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop/lampshades" className="btn-primary">
              Shop lampshades
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
        <div>
          <p className="eyebrow mb-2">Made to order</p>
          <p className="prose-muted">
            Most pieces are handmade after you order, so proportions and fabrics stay considered —
            not mass-produced.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-2">UK workshop</p>
          <p className="prose-muted">
            Based at {SITE.address}. Visit by appointment or message the studio for project advice.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-2">Matching ranges</p>
          <p className="prose-muted">
            Many patterns are available as shades, fabrics and cushion covers so rooms feel
            coordinated.
          </p>
        </div>
      </div>
    </div>
  );
}
