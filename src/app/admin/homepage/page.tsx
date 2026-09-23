import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { HomepageSectionEditor } from "@/components/admin/HomepageSectionEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomepageAdminPage() {
  await requirePermission("content.view");
  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="admin-h1">Homepage</h1>
      <p className="admin-muted mb-4">
        Edit hero and editorial copy. Storefront picks up enabled sections.{" "}
        <Link href="/" className="underline" target="_blank">
          View site
        </Link>
      </p>
      {sections.length === 0 ? (
        <p className="prose-muted">
          No sections yet. Run <code>node scripts/seed-p2-content.js</code> to seed defaults.
        </p>
      ) : (
        <HomepageSectionEditor
          sections={sections.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            subtitle: s.subtitle,
            body: s.body,
            imageUrl: s.imageUrl,
            ctaLabel: s.ctaLabel,
            ctaHref: s.ctaHref,
            sortOrder: s.sortOrder,
            enabled: s.enabled,
          }))}
        />
      )}
    </div>
  );
}
