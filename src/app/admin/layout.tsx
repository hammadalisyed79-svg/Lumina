import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();

  return (
    <div className="admin-app">
      <AdminSidebar
        permissions={session.user.permissions || []}
        role={session.user.role}
      />
      <div className="admin-main">
        <AdminTopbar email={session.user.email} name={session.user.name} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
