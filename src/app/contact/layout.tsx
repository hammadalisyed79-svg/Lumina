import type { Metadata } from "next";
import { COPY } from "@/lib/copy";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Contact",
  description: COPY.contact.body,
  openGraph: {
    title: "Contact | Lumina Hub",
    description: COPY.contact.body,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
