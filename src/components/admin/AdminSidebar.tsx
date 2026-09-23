"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/components/admin/nav";

export function AdminSidebar({
  permissions,
  role,
}: {
  permissions: string[];
  role: string;
}) {
  const pathname = usePathname();
  const isSuper = role === "SUPER_ADMIN";
  const can = (key?: string) => !key || isSuper || permissions.includes(key);

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <p className="admin-brand-kicker">Back office</p>
        <p className="admin-brand-title">Lumina Hub</p>
      </div>
      <nav className="admin-nav">
        {ADMIN_NAV.map((group) => {
          const items = group.items.filter((i) => can(i.permission));
          if (!items.length) return null;
          return (
            <div key={group.title} className="admin-nav-group">
              <p className="admin-nav-group-title">{group.title}</p>
              <ul>
                {items.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={active ? "admin-nav-link active" : "admin-nav-link"}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
