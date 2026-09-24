"use client";

import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";
import { useCart } from "@/components/cart/CartProvider";
import {
  cartLineHref,
  cartLineKindLabel,
  editConfiguredHref,
  formatCartConfig,
} from "@/lib/cart/display";
import type { CartLine } from "@/lib/cart/types";
import { formatMoney } from "@/lib/utils";

type Variant = "drawer" | "page" | "summary";

export function CartLineItem({
  item,
  variant = "page",
  onNavigate,
}: {
  item: CartLine;
  variant?: Variant;
  onNavigate?: () => void;
}) {
  const { updateQty, remove, beginEditConfigured } = useCart();
  const href = cartLineHref(item);
  const editHref = editConfiguredHref(item);
  const compact = variant === "summary";
  const imgSize = variant === "drawer" ? "80px" : variant === "page" ? "96px" : "64px";
  const boxClass =
    variant === "page"
      ? "relative h-28 w-24 bg-stone shrink-0"
      : variant === "drawer"
        ? "relative h-24 w-20 bg-stone shrink-0"
        : "relative h-16 w-14 bg-stone shrink-0";

  return (
    <div
      className={`flex gap-4 ${variant === "page" ? "border-b border-line pb-6" : ""}`}
    >
      <div className={boxClass}>
        {item.imageUrl ? (
          <MediaImage
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes={imgSize}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-wide uppercase text-muted px-1 text-center">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[10px] tracking-[0.12em] uppercase text-muted">
            {cartLineKindLabel(item.kind)}
          </span>
        </div>
        {href ? (
          <Link
            href={href}
            className="font-medium hover:text-bronze transition-colors line-clamp-2"
            onClick={onNavigate}
          >
            {item.title}
          </Link>
        ) : (
          <p className="font-medium line-clamp-2">{item.title}</p>
        )}
        {item.config && (
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            {formatCartConfig(item.config, compact)}
          </p>
        )}
        {item.validationError && (
          <p className="text-xs text-error mt-1.5" role="alert">
            {item.validationError}
          </p>
        )}
        {!compact && (
          <p className="text-xs text-muted mt-1">
            {formatMoney(item.unitPrice)} each
          </p>
        )}
        {variant !== "summary" && (
          <>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="qty-control">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.title}`}
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                >
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.title}`}
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="text-sm font-medium">
                {formatMoney(item.unitPrice * item.quantity)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                className="text-xs text-muted underline underline-offset-4 hover:text-bronze focus-ring"
                onClick={() => remove(item.id)}
              >
                Remove
              </button>
              {item.kind === "configured" && editHref && (
                <Link
                  href={editHref}
                  className="text-xs text-muted underline underline-offset-4 hover:text-bronze"
                  onClick={() => {
                    beginEditConfigured(item);
                    onNavigate?.();
                  }}
                >
                  Edit bag configuration
                </Link>
              )}
              {item.kind === "product" && href && (
                <Link
                  href={href}
                  className="text-xs text-muted underline underline-offset-4 hover:text-bronze"
                  onClick={onNavigate}
                >
                  View product
                </Link>
              )}
            </div>
          </>
        )}
        {variant === "summary" && (
          <div className="mt-1 flex justify-between gap-3 text-sm">
            <span className="text-muted">Qty {item.quantity}</span>
            <span className="font-medium">
              {formatMoney(item.unitPrice * item.quantity)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
