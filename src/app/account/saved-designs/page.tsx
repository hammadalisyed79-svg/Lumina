import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { EmptyState } from "@/components/commerce/EmptyState";
import { SavedDesignActions } from "@/components/studio/SavedDesignActions";
import { buildStudioSharePath } from "@/lib/studio/fabric-family";
import type { ShadeConfig } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

export default async function SavedDesignsPage() {
  const session = await requireUser();
  const designs = await prisma.savedDesign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { shape: true, fabric: true, size: true, lining: true, fitting: true },
  });

  return (
    <div className="container-site section-pad max-w-3xl">
      <nav className="page-crumb">
        <Link href="/account">Account</Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink">Saved designs</span>
      </nav>
      <header className="mb-10">
        <p className="eyebrow mb-3">Studio</p>
        <h1 className="section-title mb-3">Saved designs</h1>
        <div className="lux-rule" />
        <p className="prose-muted max-w-md">
          Reopen a configuration in the atelier, share it, or add it straight to your bag.
        </p>
      </header>

      {designs.length === 0 ? (
        <EmptyState
          eyebrow="Atelier"
          title="No saved designs yet"
          body="Compose a shade in the studio, then save it to revisit or order later."
          primary={{ href: "/design-your-shade", label: "Design your shade" }}
          secondary={{ href: "/shop/lampshades", label: "Browse lampshades" }}
        />
      ) : (
        <ul className="space-y-4">
          {designs.map((d) => {
            const parts = [
              d.shape?.name,
              d.fabric?.name,
              d.size?.name,
              d.lining?.name,
              d.fitting?.name,
            ].filter(Boolean);
            const imageUrl =
              d.previewUrl || d.fabric?.imageUrl || d.fabric?.swatchUrl || d.shape?.imageUrl;
            const studioHref = buildStudioSharePath({
              shapeKey: d.shape?.key,
              fabricSlug: d.fabric?.slug,
              sizeSlug: d.size?.slug,
              liningSlug: d.lining?.slug,
              fittingSlug: d.fitting?.slug,
              step: 5,
            });

            const canBag =
              d.shape?.key &&
              d.fabric?.slug &&
              d.size?.slug &&
              d.lining?.slug &&
              d.fitting?.slug;

            const config: ShadeConfig | null = canBag
              ? {
                  shapeKey: d.shape!.key,
                  shapeName: d.shape!.name,
                  fabricSlug: d.fabric!.slug,
                  fabricName: d.fabric!.name,
                  sizeSlug: d.size!.slug,
                  sizeName: d.size!.name,
                  liningSlug: d.lining!.slug,
                  liningName: d.lining!.name,
                  fittingSlug: d.fitting!.slug,
                  fittingName: d.fitting!.name,
                  unitPrice: toNumber(d.unitPrice),
                }
              : null;

            const displayName = d.name || "Custom shade";

            return (
              <li key={d.id} className="surface-panel p-4 md:p-5">
                <div className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 bg-stone overflow-hidden">
                    {imageUrl && (
                      <MediaImage
                        src={imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-lg">{displayName}</p>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{parts.join(" · ")}</p>
                    <p className="mt-2 font-medium">{formatMoney(toNumber(d.unitPrice))}</p>
                    <p className="text-xs text-muted mt-2">
                      Saved {d.createdAt.toLocaleDateString("en-GB")}
                    </p>
                    <div className="mt-4">
                      <SavedDesignActions
                        id={d.id}
                        name={displayName}
                        title={d.name || `Custom ${d.shape?.name} · ${d.fabric?.name}`}
                        imageUrl={imageUrl}
                        config={config}
                        studioHref={studioHref}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
