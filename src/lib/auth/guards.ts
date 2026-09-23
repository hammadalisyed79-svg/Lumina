import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isStaffRole, roleHasPermission } from "@/lib/auth/permissions";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/login");
  return session;
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/login?callbackUrl=/admin");
  if (!isStaffRole(session.user.role)) redirect("/");
  return session;
}

/** @deprecated Prefer requireStaff / requirePermission — kept for compatibility */
export async function requireAdmin() {
  return requireStaff();
}

export async function requirePermission(key: string) {
  const session = await requireStaff();
  const role = session.user.role as Role;
  if (role === "SUPER_ADMIN") return session;
  const ok = await roleHasPermission(role, key);
  if (!ok) redirect("/admin?error=forbidden");
  return session;
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) return null;
  return session;
}

export async function getStaffSession() {
  return getAdminSession();
}
