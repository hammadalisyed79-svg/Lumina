import type { Metadata } from "next";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "About",
  description: COPY.about.p1.slice(0, 155),
  openGraph: {
    title: `${COPY.about.title} | Lumina Hub`,
    description: COPY.about.p1.slice(0, 155),
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
