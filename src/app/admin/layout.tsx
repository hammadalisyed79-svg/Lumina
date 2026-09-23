import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/fabrics", label: "Fabrics" },
  { href: "/admin/sizes", label: "Sizes" },
  { href: "/admin/linings", label: "Linings" },
  { href: "/admin/fittings", label: "Fittings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/trade", label: "Trade" },
  { href: "/admin/bespoke", label: "Bespoke" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/media", label: "Media" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[color:var(--stone)]/30">
      <div className="border-b border-[color:var(--line)] bg-[color:var(--ivory)]">
        <div className="container-site py-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">Admin</p>
            <p className="font-display text-2xl">Lumina Hub</p>
          </div>
          <Link href="/" className="text-sm underline">
            View storefront
          </Link>
        </div>
      </div>
      <div className="container-site py-8 grid lg:grid-cols-[220px_1fr] gap-8">
        <nav className="space-y-1 h-fit lg:sticky lg:top-28">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2 text-sm hover:bg-white border border-transparent hover:border-[color:var(--line)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
