import { MediaImage } from "@/components/media/MediaImage";

export type ReviewDisplay = {
  id: string;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase?: boolean;
  images?: { id: string; url: string; alt: string | null }[];
};

export function VerifiedPurchaseBadge() {
  return (
    <span className="review-verified" title="Confirmed against a paid Lumina Hub order">
      Verified purchase
    </span>
  );
}

export function ProductReviewsList({ reviews }: { reviews: ReviewDisplay[] }) {
  if (reviews.length === 0) {
    return <p className="prose-muted text-sm">No reviews yet — be the first.</p>;
  }

  return (
    <div className="space-y-5">
      {reviews.map((r) => (
        <div key={r.id} className="border-t border-line pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-bronze text-sm tracking-widest">{"★".repeat(r.rating)}</p>
            {r.verifiedPurchase ? <VerifiedPurchaseBadge /> : null}
          </div>
          {r.title && <p className="font-medium mt-2">{r.title}</p>}
          <p className="prose-muted text-sm mt-1.5 leading-relaxed">{r.body}</p>
          {r.images && r.images.length > 0 && (
            <div className="flex gap-2 mt-3">
              {r.images.map((img) => (
                <div key={img.id} className="relative w-20 h-20 overflow-hidden bg-stone">
                  <MediaImage
                    src={img.url}
                    alt={img.alt || "Customer photo"}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted mt-2">{r.author}</p>
        </div>
      ))}
    </div>
  );
}
