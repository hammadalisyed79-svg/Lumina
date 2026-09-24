import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export const STAFF_ROLES: Role[] = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export const PERMISSION_CATALOG: {
  key: string;
  label: string;
  module: string;
  description?: string;
}[] = [
  { key: "dashboard.view", label: "View dashboard", module: "dashboard" },
  { key: "products.view", label: "View products", module: "products" },
  { key: "products.edit", label: "Edit products", module: "products" },
  { key: "collections.view", label: "View collections", module: "collections" },
  { key: "collections.edit", label: "Edit collections", module: "collections" },
  { key: "fabrics.view", label: "View fabrics", module: "fabrics" },
  { key: "fabrics.edit", label: "Edit fabrics", module: "fabrics" },
  { key: "shapes.view", label: "View shapes", module: "shapes" },
  { key: "shapes.edit", label: "Edit shapes", module: "shapes" },
  { key: "sizes.view", label: "View sizes", module: "sizes" },
  { key: "sizes.edit", label: "Edit sizes", module: "sizes" },
  { key: "linings.view", label: "View linings", module: "linings" },
  { key: "linings.edit", label: "Edit linings", module: "linings" },
  { key: "fittings.view", label: "View fittings", module: "fittings" },
  { key: "fittings.edit", label: "Edit fittings", module: "fittings" },
  { key: "inventory.view", label: "View inventory", module: "inventory" },
  { key: "inventory.edit", label: "Edit inventory", module: "inventory" },
  { key: "orders.view", label: "View orders", module: "orders" },
  { key: "orders.edit", label: "Edit orders", module: "orders" },
  { key: "orders.fulfil", label: "Fulfil orders", module: "orders" },
  { key: "orders.notes", label: "Order internal notes", module: "orders" },
  { key: "customers.view", label: "View customers", module: "customers" },
  { key: "customers.edit", label: "Edit customers", module: "customers" },
  { key: "discounts.view", label: "View discounts", module: "discounts" },
  { key: "discounts.edit", label: "Edit discounts", module: "discounts" },
  { key: "shipping.view", label: "View shipping", module: "shipping" },
  { key: "shipping.edit", label: "Edit shipping", module: "shipping" },
  { key: "reviews.view", label: "View reviews", module: "reviews" },
  { key: "reviews.edit", label: "Moderate reviews", module: "reviews" },
  { key: "bespoke.view", label: "View bespoke", module: "bespoke" },
  { key: "bespoke.edit", label: "Edit bespoke", module: "bespoke" },
  { key: "trade.view", label: "View trade", module: "trade" },
  { key: "trade.edit", label: "Edit trade", module: "trade" },
  { key: "enquiries.view", label: "View enquiries", module: "enquiries" },
  { key: "enquiries.edit", label: "Edit enquiries", module: "enquiries" },
  { key: "newsletter.view", label: "View newsletter", module: "newsletter" },
  { key: "newsletter.edit", label: "Edit newsletter", module: "newsletter" },
  { key: "content.view", label: "View content", module: "content" },
  { key: "content.edit", label: "Edit content", module: "content" },
  { key: "media.view", label: "View media", module: "media" },
  { key: "media.edit", label: "Edit media", module: "media" },
  { key: "seo.view", label: "View SEO", module: "seo" },
  { key: "seo.edit", label: "Edit SEO", module: "seo" },
  { key: "navigation.view", label: "View navigation", module: "navigation" },
  { key: "navigation.edit", label: "Edit navigation", module: "navigation" },
  { key: "users.view", label: "View users", module: "users" },
  { key: "users.edit", label: "Edit users", module: "users" },
  { key: "settings.view", label: "View settings", module: "settings" },
  { key: "settings.edit", label: "Edit settings", module: "settings" },
  { key: "audit.view", label: "View audit log", module: "audit" },
];

const ADMIN_KEYS = PERMISSION_CATALOG.map((p) => p.key);
const STAFF_KEYS = ADMIN_KEYS.filter(
  (k) =>
    !k.startsWith("users.") &&
    !k.startsWith("settings.") &&
    k !== "audit.view"
);

export function isStaffRole(role: string | undefined | null): boolean {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}

export async function seedPermissions() {
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: p,
      update: { label: p.label, module: p.module, description: p.description },
    });
  }

  const all = await prisma.permission.findMany();
  const byKey = Object.fromEntries(all.map((p) => [p.key, p.id]));

  async function grant(role: Role, keys: string[]) {
    for (const key of keys) {
      const permissionId = byKey[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        create: { role, permissionId },
        update: {},
      });
    }
  }

  await grant("SUPER_ADMIN", ADMIN_KEYS);
  await grant("ADMIN", ADMIN_KEYS);
  await grant("STAFF", STAFF_KEYS);
}

export async function getPermissionsForRole(role: Role): Promise<string[]> {
  if (role === "SUPER_ADMIN") {
    return PERMISSION_CATALOG.map((p) => p.key);
  }
  const rows = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });
  return rows.map((r) => r.permission.key);
}

export async function roleHasPermission(role: Role, key: string): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;
  const perm = await prisma.permission.findUnique({ where: { key } });
  if (!perm) return false;
  const row = await prisma.rolePermission.findUnique({
    where: { role_permissionId: { role, permissionId: perm.id } },
  });
  return !!row;
}
