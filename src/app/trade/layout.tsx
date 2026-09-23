import type { Metadata } from "next";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Trade",
  description: COPY.tradePage.body,
  openGraph: {
    title: `${COPY.tradePage.title} | Lumina Hub`,
    description: COPY.tradePage.body,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
