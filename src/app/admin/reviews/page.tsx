import { prisma } from "@/lib/db";
import { ReviewModeration } from "@/components/admin/ReviewModeration";
import { MediaImage } from "@/components/media/MediaImage";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      images: { orderBy: { sortOrder: "asc" }, take: 3 },
    },
    take: 100,
  });

  return (
    <div>
      <h1 className="admin-h1">Reviews</h1>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="admin-panel">
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium flex flex-wrap items-center gap-2">
                  {r.author} · {"★".repeat(r.rating)} ·{" "}
                  <span className="admin-badge">{r.status}</span>
                  {r.verifiedPurchase && (
                    <span className="admin-badge is-ok">Verified purchase</span>
                  )}
                </p>
                <p className="admin-muted text-sm">{r.product.title}</p>
                {r.title && <p className="mt-2">{r.title}</p>}
                <p className="prose-muted text-sm mt-1">{r.body}</p>
                {r.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {r.images.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-16 h-16 overflow-hidden bg-[#ebe6dc]"
                      >
                        <MediaImage
                          src={img.url}
                          alt={img.alt || ""}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <ReviewModeration id={r.id} status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
