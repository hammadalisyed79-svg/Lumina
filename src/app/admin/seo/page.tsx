import { prisma } from "@/lib/db";
import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "seo_default" } });
  const value = (setting?.value as { title?: string; description?: string }) || {};

  return (
    <div>
      <h1 className="admin-h1">SEO</h1>
      <SeoSettingsForm title={value.title || ""} description={value.description || ""} />
      <p className="admin-muted mt-8 text-sm">
        Per-product and per-collection SEO fields are editable on those records. Sitemap is available
        at <code>/sitemap.xml</code>.
      </p>
    </div>
  );
}
