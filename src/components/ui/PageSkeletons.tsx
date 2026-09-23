export function ShopSkeleton() {
  return (
    <div className="container-site section-pad" aria-busy="true" aria-label="Loading shop">
      <div className="skel skel-line w-24 mb-3" />
      <div className="skel skel-title w-64 mb-6" />
      <div className="skel skel-line w-full max-w-xl mb-10 h-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skel aspect-[4/5] w-full" />
            <div className="skel skel-line w-3/4" />
            <div className="skel skel-line w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-site py-8 md:py-12" aria-busy="true" aria-label="Loading product">
      <div className="skel skel-line w-40 mb-8" />
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-3">
          <div className="skel aspect-[4/5] w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skel aspect-square" />
            <div className="skel aspect-square" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="skel skel-line w-20" />
          <div className="skel skel-title w-4/5" />
          <div className="skel skel-line w-1/3" />
          <div className="skel skel-line w-full h-16 mt-6" />
          <div className="skel h-12 w-full mt-8" />
          <div className="skel h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
