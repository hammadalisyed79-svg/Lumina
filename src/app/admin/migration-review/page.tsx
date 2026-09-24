import Link from "next/link";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ReviewItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
  confidence?: string;
};

function loadEligibilityNeedsReview(): ReviewItem[] {
  const file = path.join(process.cwd(), "data", "configurator", "eligibility-seed-report.json");
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as {
      relationships?: {
        relationship: string;
        needsReview?: boolean;
        confidence?: string;
        detail?: string;
        source?: string;
      }[];
    };
    return (raw.relationships || [])
      .filter((r) => r.needsReview)
      .slice(0, 200)
      .map((r, i) => ({
        id: `elig-${i}`,
        kind: "Compatibility",
        title: r.relationship,
        detail: `${r.source || "seed"} · ${r.detail || ""}`.trim(),
        href: "/admin/shapes",
        confidence: r.confidence,
      }));
  } catch {
    return [];
  }
}

function loadFabricAuditReview(): ReviewItem[] {
  const file = path.join(process.cwd(), "data", "configurator", "fabric-audit.json");
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as {
      fabrics?: {
        fabricId: string;
        name: string;
        recommendedAction?: string;
        usableAsTexture?: boolean;
        sourceImage?: string;
      }[];
    };
    return (raw.fabrics || [])
      .filter((f) => (f.recommendedAction || "").toLowerCase().includes("confirm"))
      .map((f) => ({
        id: `fabric-${f.fabricId}`,
        kind: "Fabric texture",
        title: f.name,
        detail: f.recommendedAction || "Confirm name ↔ image mapping",
        href: "/admin/fabrics",
      }));
  } catch {
    return [];
  }
}

export default async function AdminMigrationReviewPage() {
  const [products, sizesMissingTaper, unscopedSizes] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { migrationStatus: "NEEDS_REVIEW" },
          { migrationStatus: "FAILED" },
          { images: { none: {} } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        sourceTitle: true,
        migrationStatus: true,
        slug: true,
        _count: { select: { images: true } },
      },
    }),
    prisma.size.findMany({
      where: {
        active: true,
        OR: [{ topDiameterCm: null }, { bottomDiameterCm: null }],
      },
      take: 50,
      select: { id: true, name: true, slug: true, diameterCm: true },
    }),
    prisma.size.findMany({
      where: { active: true, shapeId: null },
      take: 50,
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const items: ReviewItem[] = [
    ...products.map((p) => ({
      id: p.id,
      kind: p._count.images === 0 ? "Missing images" : "Product migration",
      title: p.title,
      detail: p.sourceTitle
        ? `Source: ${p.sourceTitle.slice(0, 120)} · status ${p.migrationStatus || "—"}`
        : `status ${p.migrationStatus || "—"}`,
      href: `/admin/products/${p.id}`,
    })),
    ...sizesMissingTaper.map((s) => ({
      id: `size-taper-${s.id}`,
      kind: "Size dimensions",
      title: s.name,
      detail: "Missing topDiameterCm and/or bottomDiameterCm (needed for Empire/Coolie accuracy)",
      href: "/admin/sizes",
      confidence: "NEEDS_REVIEW",
    })),
    ...unscopedSizes.map((s) => ({
      id: `size-scope-${s.id}`,
      kind: "Unscoped size",
      title: s.name,
      detail: "Size.shapeId is null — confirm Shape↔Size eligibility in admin",
      href: "/admin/shapes",
      confidence: "NEEDS_REVIEW",
    })),
    ...loadFabricAuditReview(),
    ...loadEligibilityNeedsReview(),
  ];

  return (
    <div>
      <h1 className="admin-h1">Migration review queue</h1>
      <p className="admin-muted mb-6 max-w-2xl">
        Uncertain migrated catalogue and configurator relationships. Do not hide these — confirm
        in admin before treating as production-final. Phase 3 blocks ordering for Empire/Coolie
        sizes missing top/bottom diameters, unscoped sizes, and NEEDS_REVIEW fabric×shape (and
        other eligibility) links — measurements are never invented.
      </p>
      <p className="text-sm mb-4">
        <strong>{items.length}</strong> items flagged ·{" "}
        <Link href="/admin/products" className="underline">
          Products
        </Link>{" "}
        ·{" "}
        <Link href="/admin/shapes" className="underline">
          Shapes / eligibility
        </Link>{" "}
        ·{" "}
        <Link href="/admin/fabrics" className="underline">
          Fabrics
        </Link>
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Item</th>
              <th>Detail</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="admin-muted">
                  No review items right now.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="admin-badge">{item.kind}</span>
                  </td>
                  <td>{item.title}</td>
                  <td className="text-sm admin-muted max-w-md">{item.detail}</td>
                  <td>
                    <Link href={item.href} className="text-xs underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
