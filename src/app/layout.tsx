import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { AnalyticsScript } from "@/components/analytics/AnalyticsScript";
import { SITE } from "@/lib/site";
import { COPY } from "@/lib/copy";
import { getPrimaryNavLinks } from "@/lib/navigation";
import {
  DEFAULT_OG_IMAGE,
  JsonLd,
  getSiteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} | Handmade Lampshades & Interior Textiles`,
    template: `%s | ${SITE.name}`,
  },
  description: COPY.metaDescription,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE.name,
    title: `${SITE.name} | Handmade Lampshades & Interior Textiles`,
    description: COPY.metaDescription,
    url: siteUrl,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Lumina Hub handmade lampshades",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Handmade Lampshades & Interior Textiles`,
    description: COPY.metaDescription,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nav = await getPrimaryNavLinks();
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AnalyticsScript />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <StorefrontShell nav={nav}>{children}</StorefrontShell>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
