import type { Metadata } from "next";
import { SizeGuideWizard } from "@/components/guides/SizeGuideWizard";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Size & fitting guide",
  description:
    "Find the right lampshade diameter and silhouette for table, floor and pendant lamps — then open the Lumina Hub studio to configure fabric and fitting.",
  openGraph: {
    title: "Size & fitting guide | Lumina Hub",
    description:
      "Interactive guidance for shade diameter and form, with a direct path into Design your shade.",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function SizeGuidePage() {
  return (
    <div className="container-site section-pad max-w-3xl">
      <p className="eyebrow mb-3">Fit</p>
      <h1 className="section-title mb-3">Size guide</h1>
      <div className="lux-rule" />
      <p className="prose-muted mb-8">
        Proportion is everything: diameter against the lamp base, height against the room. Use the
        short wizard below, then refine in the atelier — or browse ready shades by shape.
      </p>
      <SizeGuideWizard />
    </div>
  );
}
