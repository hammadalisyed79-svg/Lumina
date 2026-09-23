import type { Metadata } from "next";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: COPY.designPage.title,
  description: COPY.designPage.body,
  openGraph: {
    title: `${COPY.designPage.title} | Lumina Hub`,
    description: COPY.designPage.body,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
