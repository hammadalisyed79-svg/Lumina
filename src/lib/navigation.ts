import { prisma } from "@/lib/db";
import { PRIMARY_NAV } from "@/lib/site";

export type NavLink = { href: string; label: string; mega?: "lampshades" };

export async function getPrimaryNavLinks(): Promise<NavLink[]> {
  try {
    const menu = await prisma.navigationMenu.findUnique({
      where: { key: "primary" },
      include: {
        items: {
          where: { enabled: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (menu?.items?.length) {
      return menu.items.map((i) => ({
        href: i.url,
        label: i.label,
        mega: i.url.includes("lampshade") ? ("lampshades" as const) : undefined,
      }));
    }
  } catch {
    // DB may be unavailable during build
  }
  return PRIMARY_NAV.map((n) => ({
    href: n.href,
    label: n.label,
    mega: n.mega,
  }));
}
