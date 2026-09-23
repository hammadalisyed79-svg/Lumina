import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { WishlistMerge } from "@/components/wishlist/WishlistMerge";
import { ProductCard } from "@/components/shop/ProductCard";
import { toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const session = await requireUser();
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } } },
      },
    },
  });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
      include: {
        items: {
          include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } } },
        },
      },
    });
  }

  const products = wishlist.items.map((i) => ({
    id: i.product.id,
    slug: i.product.slug,
    title: i.product.title,
    subtitle: i.product.subtitle,
    basePrice: toNumber(i.product.basePrice),
    imageUrl: i.product.images[0]?.url || "/demo-assets/products/placeholder.svg",
    hoverImageUrl: i.product.images[1]?.url,
  }));

  return (
    <div className="container-site py-12">
      <WishlistMerge />
      <Link href="/account" className="text-sm text-[color:var(--muted)]">← Account</Link>
      <h1 className="font-display text-4xl mt-4 mb-8">Wishlist</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="prose-muted">No saved pieces yet.</p>}
    </div>
  );
}
