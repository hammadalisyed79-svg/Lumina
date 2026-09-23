import Link from "next/link";
import { ANNOUNCEMENT, NAV_MEGA, SITE } from "@/lib/site";
import type { NavLink } from "@/lib/navigation";
import { HeaderActions } from "./HeaderActions";
import { MobileNav } from "./MobileNav";
import { MegaMenu } from "./MegaMenu";

export function Header({ nav }: { nav: NavLink[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory text-ink">
      <div className="bg-charcoal text-ivory text-center text-[10px] sm:text-[11px] tracking-[0.14em] sm:tracking-[0.18em] uppercase py-2.5 px-3 leading-snug">
        {ANNOUNCEMENT}
      </div>
      <div className="container-site flex items-center gap-1 sm:gap-3 py-3 md:py-4">
        <MobileNav items={nav} />
        <Link
          href="/"
          className="flex-1 lg:flex-none min-w-0 text-center lg:text-left font-display text-[1.45rem] sm:text-[1.75rem] md:text-[2rem] tracking-tight text-ink truncate"
        >
          {SITE.name}
        </Link>
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 text-[12px] tracking-[0.12em] uppercase text-ink">
          {nav.map((item) =>
            item.mega ? (
              <MegaMenu key={item.href} item={item} menu={NAV_MEGA.lampshades} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-1 transition-colors hover:text-bronze after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-bronze after:transition-transform after:duration-300 hover:after:scale-x-100"
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
