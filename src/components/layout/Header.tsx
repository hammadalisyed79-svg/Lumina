import Image from "next/image";
import Link from "next/link";
import { ANNOUNCEMENT, NAV_MEGA, SITE } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";
import { HeaderActions } from "./HeaderActions";
import { MobileNav } from "./MobileNav";
import { MegaMenu } from "./MegaMenu";

export function Header({ nav }: { nav: NavLink[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory text-ink shadow-[0_1px_0_rgba(28,25,21,0.06)]">
      <div className="bg-charcoal text-ivory text-center text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.14em] uppercase py-2 px-3 leading-snug">
        {ANNOUNCEMENT}
      </div>
      <div className="container-site flex items-center gap-1 sm:gap-3 py-2.5 md:py-4">
        <MobileNav items={nav} />
        <Link
          href="/"
          className="flex-1 lg:flex-none min-w-0 text-center lg:text-left font-display text-[1.35rem] sm:text-2xl md:text-3xl tracking-tight text-ink truncate"
        >
          {SITE.name}
        </Link>
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-7 text-[13px] tracking-[0.06em] uppercase text-ink">
          {nav.map((item) =>
            item.mega ? (
              <MegaMenu key={item.href} item={item} menu={NAV_MEGA.lampshades} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-bronze transition-colors"
              >
                {item.label}
              </Link>
            )
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
