import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { NavigationAdminClient } from "@/components/admin/NavigationAdminClient";

export const dynamic = "force-dynamic";

export default async function NavigationAdminPage() {
  await requirePermission("navigation.view");
  const menu = await prisma.navigationMenu.findUnique({
    where: { key: "primary" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Navigation</h1>
      <p className="text-sm text-[color:var(--muted)] mb-8">
        Primary header links. Disabled items are hidden on the storefront.
      </p>
      {!menu ? (
        <p className="prose-muted">
          No primary menu. Run <code>node scripts/seed-p2-content.js</code>.
        </p>
      ) : (
        <NavigationAdminClient
          menuId={menu.id}
          items={menu.items.map((i) => ({
            id: i.id,
            label: i.label,
            url: i.url,
            sortOrder: i.sortOrder,
            enabled: i.enabled,
          }))}
        />
      )}
    </div>
  );
}
