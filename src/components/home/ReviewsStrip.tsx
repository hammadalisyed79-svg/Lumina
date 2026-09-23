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
  }[];
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {reviews.map((r) => (
        <blockquote key={r.id} className="border-t border-[color:var(--line)] pt-6">
          <p className="text-[color:var(--bronze)] tracking-widest text-sm mb-3">
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </p>
          {r.title && <p className="font-medium mb-2">{r.title}</p>}
          <p className="prose-muted text-[15px] mb-4">&ldquo;{r.body}&rdquo;</p>
          <p className="text-sm">
            {r.author}
            <span className="text-[color:var(--muted)]"> · {r.productTitle}</span>
          </p>
        </blockquote>
      ))}
    </div>
  );
}
