"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { StudioChat } from "@/components/chat/StudioChat";
import type { NavLink } from "@/lib/navigation";

export function StorefrontShell({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: NavLink[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header nav={nav} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <StudioChat />
      <CartDrawer />
      <SearchOverlay />
    </>
  );
}
