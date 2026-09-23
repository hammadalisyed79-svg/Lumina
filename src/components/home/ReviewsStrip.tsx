import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { VerifiedPurchaseBadge } from "@/components/product/ProductReviewsList";

export function ReviewsStrip({
  reviews,
}: {
  reviews: {
    id: string;
    author: string;
    rating: number;
    title: string | null;
    body: string;
    productTitle: string;
    verifiedPurchase?: boolean;
    imageUrl?: string | null;
  }[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="border border-line p-8 md:p-10 text-center max-w-xl mx-auto">
        <p className="prose-muted mb-4">
          Customer reviews will appear here once approved. Meanwhile, explore the catalogue or ask
          the studio about a piece.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop/lampshades" className="btn-secondary">
            Shop lampshades
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {reviews.map((r) => (
        <blockquote key={r.id} className="border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="text-bronze tracking-widest text-sm mb-0">
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
            </p>
            {r.verifiedPurchase ? <VerifiedPurchaseBadge /> : null}
          </div>
          {r.imageUrl && (
            <div className="relative aspect-[4/3] mb-4 overflow-hidden bg-stone">
              <MediaImage
                src={r.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
          )}
          {r.title && <p className="font-medium mb-2">{r.title}</p>}
          <p className="prose-muted text-[15px] mb-4">&ldquo;{r.body}&rdquo;</p>
          <p className="text-sm">
            {r.author}
            <span className="text-muted"> · {r.productTitle}</span>
          </p>
        </blockquote>
      ))}
    </div>
  );
}
