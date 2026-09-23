import { prisma } from "@/lib/db";
import { MediaImage } from "@/components/media/MediaImage";
import { MediaAssetEditor } from "@/components/admin/MediaAssetEditor";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ folder?: string; q?: string }>;
};

export default async function AdminMediaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const where: Prisma.MediaAssetWhereInput = {};
  if (sp.folder) where.folder = sp.folder;
  if (sp.q?.trim()) {
    const q = sp.q.trim();
    where.OR = [
      { key: { contains: q, mode: "insensitive" } },
      { filename: { contains: q, mode: "insensitive" } },
      { alt: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, folders] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.mediaAsset.findMany({
      where: { folder: { not: null } },
      distinct: ["folder"],
      select: { folder: true },
      take: 40,
    }),
  ]);

  const folderList = folders
    .map((f) => f.folder)
    .filter((f): f is string => Boolean(f))
    .sort();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="admin-h1">Media</h1>
          <p className="admin-muted mb-0">
            {rows.length} assets · edit alt text, folder, and copy URLs for product images
          </p>
        </div>
        <form className="admin-actions" method="get">
          {sp.folder && <input type="hidden" name="folder" value={sp.folder} />}
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Search key / alt"
            className="admin-input"
            style={{ width: 200 }}
          />
          <button type="submit" className="btn-secondary text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="admin-filters">
        <Link
          href={sp.q ? `/admin/media?q=${encodeURIComponent(sp.q)}` : "/admin/media"}
          className={`admin-filter-chip ${!sp.folder ? "active" : ""}`}
        >
          All folders
        </Link>
        {folderList.map((f) => (
          <Link
            key={f}
            href={`/admin/media?folder=${encodeURIComponent(f)}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
            className={`admin-filter-chip ${sp.folder === f ? "active" : ""}`}
          >
            {f}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="admin-muted">No media assets yet. Product image URLs register here as they are used.</p>
      ) : (
        <div className="admin-media-grid">
          {rows.map((row) => (
            <article key={row.id} className="admin-panel admin-media-card">
              <div className="admin-media-thumb">
                {row.type === "image" || /\.(jpe?g|png|webp|gif|avif)$/i.test(row.url) ? (
                  <MediaImage
                    src={row.url}
                    alt={row.alt || row.filename || row.key}
                    width={320}
                    height={240}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="admin-muted text-xs p-4">{row.type}</div>
                )}
              </div>
              <div className="space-y-2 mt-3">
                <p className="text-xs font-mono break-all">{row.key}</p>
                <p className="admin-muted text-xs break-all">{row.url}</p>
                <MediaAssetEditor
                  id={row.id}
                  alt={row.alt}
                  caption={row.caption}
                  folder={row.folder}
                  url={row.url}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
