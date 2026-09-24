import type { Metadata } from "next";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: COPY.bespokePage.title,
  description: COPY.bespokePage.metaDescription,
  openGraph: {
    title: `${COPY.bespokePage.title} | Lumina Hub`,
    description: COPY.bespokePage.metaDescription,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function BespokeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
