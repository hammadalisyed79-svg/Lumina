import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { requirePermission } from "@/lib/auth/guards";

export default async function Page() {
  await requirePermission("navigation.view");
  return (
    <AdminPlaceholder
      title="Navigation"
      phase="Phase 10"
      description="Header mega-menu and footer link management with enable/disable and sort order."
    />
  );
}
