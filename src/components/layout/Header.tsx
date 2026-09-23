import Image from "next/image";
import Link from "next/link";
import { ANNOUNCEMENT, NAV_MEGA, PRIMARY_NAV, SITE } from "@/lib/site";
import { HeaderActions } from "./HeaderActions";
import { MobileNav } from "./MobileNav";
import { MegaMenu } from "./MegaMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[color:var(--ivory)]/95 backdrop-blur-md border-b border-[color:var(--line)]">
      <div className="bg-[color:var(--charcoal)] text-[color:var(--ivory)] text-center text-[11px] tracking-[0.14em] uppercase py-2 px-4">
        {ANNOUNCEMENT}
      </div>
      <div className="container-site flex items-center justify-between gap-4 py-3 md:py-4">
        <MobileNav />
        <Link href="/" className="font-display text-2xl md:text-3xl tracking-tight text-[color:var(--ink)]">
          {SITE.name}
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.06em] uppercase">
          {PRIMARY_NAV.map((item) =>
            item.mega ? (
              <MegaMenu key={item.href} item={item} menu={NAV_MEGA.lampshades} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[color:var(--bronze)] transition-colors"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <HeaderActions />
      </div>
    </header>
  );
}

export function BrandMark() {
  return (
    <div className="relative h-10 w-10 overflow-hidden">
      <Image src="/demo-assets/shapes/drum.svg" alt="" fill className="object-cover opacity-80" />
    </div>
  );
}
