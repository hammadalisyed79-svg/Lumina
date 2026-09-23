import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { requirePermission } from "@/lib/auth/guards";

export default async function Page() {
  await requirePermission("settings.view");
  return (
    <AdminPlaceholder
      title="Settings"
      phase="Phase 12"
      description="Brand, contact, commerce currency, order prefix, social links and maintenance mode. Shipping zone UI moves here from the old shipping list in Phase 11."
    />
  );
}
