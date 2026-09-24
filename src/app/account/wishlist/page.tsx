import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { WishlistMerge } from "@/components/wishlist/WishlistMerge";
import { AccountWishlistGrid } from "@/components/wishlist/AccountWishlistGrid";
import { toNumber } from "@/lib/pricing";
import { isWebImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const session = await requireUser();
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } },
        },
      },
    },
  });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } },
          },
        },
      },
    });
  }

  const products = wishlist.items.map((i) => {
    const imgs = i.product.images.filter((img) => isWebImageUrl(img.url));
    return {
      id: i.product.id,
      slug: i.product.slug,
      title: i.product.title,
      subtitle: i.product.subtitle,
      basePrice: toNumber(i.product.basePrice),
      imageUrl: imgs[0]?.url || "/demo-assets/products/placeholder.svg",
      hoverImageUrl: imgs[1]?.url,
    };
  });

  return (
    <div className="container-site section-pad">
      <WishlistMerge />
      <nav className="page-crumb">
        <Link href="/account">Account</Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink">Wishlist</span>
      </nav>
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Saved</p>
        <h1 className="section-title mb-3">Wishlist</h1>
        <div className="lux-rule" />
        <p className="prose-muted">
          Pieces you have hearted — synced to this account. Remove with the heart on any card.
        </p>
      </header>
      <AccountWishlistGrid products={products} />
    </div>
  );
}
