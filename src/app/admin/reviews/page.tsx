import { prisma } from "@/lib/db";
import { ReviewModeration } from "@/components/admin/ReviewModeration";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Reviews</h1>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-[color:var(--line)] bg-white/70 p-4">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-medium">
                  {r.author} · {"★".repeat(r.rating)} · {r.status}
                </p>
                <p className="text-sm text-[color:var(--muted)]">{r.product.title}</p>
                {r.title && <p className="mt-2">{r.title}</p>}
                <p className="prose-muted text-sm mt-1">{r.body}</p>
              </div>
              <ReviewModeration id={r.id} status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
