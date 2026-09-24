"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";

type CatalogVariant = {
  id: string;
  title: string;
  sku: string;
  priceOverride: number | null;
  shopifyVariantId: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  active: boolean;
};

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    basePrice: number;
    imageUrl?: string;
    configEnabled: boolean;
    type: string;
    shapeKey?: string | null;
    leadTimeDays?: number | null;
    variants: CatalogVariant[];
  };
};

function uniqueOptions(
  variants: CatalogVariant[],
  key: "option1" | "option2" | "option3"
) {
  const set = new Set<string>();
  for (const v of variants) {
    const val = v[key];
    if (val) set.add(val);
  }
  return [...set];
}

function variantLabel(v: CatalogVariant) {
  if (!v.title || v.title === "Default Title") return "Standard";
  return v.title;
}

const CHIP_LIMIT = 16;

function optionGroupLabel(key: "option1" | "option2" | "option3", values: string[]) {
  const sample = values.join(" ").toLowerCase();
  if (/\d+\s*cm|\d+\s*"|diameter|height|size/.test(sample)) return "Size";
  if (/ceiling|pendant|table|floor|fitting|e27|b22|reducer/.test(sample)) return "Fitting";
  if (/lining|gold|silver|copper|white|foil/.test(sample)) return "Lining";
  if (key === "option1") return "Option";
  if (key === "option2") return "Detail";
  return "Finish";
}

export function ProductConfigurator({ product }: Props) {
  const { addProduct, setDrawerOpen } = useCart();
  const purchasable = useMemo(
    () => product.variants.filter((v) => v.active),
    [product.variants]
  );

  const [variantId, setVariantId] = useState(purchasable[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const option1Values = useMemo(() => uniqueOptions(purchasable, "option1"), [purchasable]);
  const option2Values = useMemo(() => uniqueOptions(purchasable, "option2"), [purchasable]);
  const option3Values = useMemo(() => uniqueOptions(purchasable, "option3"), [purchasable]);

  const [option1, setOption1] = useState(purchasable[0]?.option1 || "");
  const [option2, setOption2] = useState(purchasable[0]?.option2 || "");
  const [option3, setOption3] = useState(purchasable[0]?.option3 || "");

  const filtered = useMemo(() => {
    let list = purchasable;
    if (option1Values.length > 1 && option1) {
      list = list.filter((v) => v.option1 === option1);
    }
    if (option2Values.length > 1 && option2) {
      list = list.filter((v) => v.option2 === option2);
    }
    if (option3Values.length > 1 && option3) {
      list = list.filter((v) => v.option3 === option3);
    }
    return list.length ? list : purchasable;
  }, [
    purchasable,
    option1,
    option2,
    option3,
    option1Values.length,
    option2Values.length,
    option3Values.length,
  ]);

  const selected = filtered.find((v) => v.id === variantId) || filtered[0];
  const unitPrice = selected?.priceOverride ?? product.basePrice;

  useEffect(() => {
    if (!filtered.some((v) => v.id === variantId) && filtered[0]) {
      setVariantId(filtered[0].id);
    }
  }, [filtered, variantId]);

  useEffect(() => {
    const el = addBtnRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [purchasable.length]);

  function pickOption(
    key: "option1" | "option2" | "option3",
    value: string,
    set: (v: string) => void
  ) {
    set(value);
    const next = purchasable.find((v) => {
      const o1 = key === "option1" ? value : option1 || v.option1;
      const o2 = key === "option2" ? value : option2 || v.option2;
      const o3 = key === "option3" ? value : option3 || v.option3;
      return (
        (!option1Values.length || !o1 || v.option1 === o1) &&
        (!option2Values.length || !o2 || v.option2 === o2) &&
        (!option3Values.length || !o3 || v.option3 === o3)
      );
    });
    if (next) setVariantId(next.id);
  }

  function add() {
    if (!selected) return;
    addProduct({
      productId: product.id,
      variantId: selected.id,
      slug: product.slug,
      title:
        selected.title && selected.title !== "Default Title"
          ? `${product.title} · ${selected.title}`
          : product.title,
      imageUrl: product.imageUrl,
      quantity: qty,
      unitPrice,
    });
    setDrawerOpen(true);
  }

  if (!purchasable.length) {
    return (
      <div className="border-t border-line pt-6 space-y-3">
        <p className="text-sm text-muted">
          This product has no active options yet. Contact the studio to order.
        </p>
      </div>
    );
  }

  const needVariantPicker = filtered.length > 1;
  const useVariantSelect = needVariantPicker && filtered.length > CHIP_LIMIT;
  const showVariantChips = needVariantPicker && !useVariantSelect;

  return (
    <div className="space-y-6 border-t border-line pt-6 pb-24 md:pb-0">
      {option1Values.length > 1 && (
        <ChipGroup
          label={optionGroupLabel("option1", option1Values)}
          values={option1Values}
          value={option1 || ""}
          onChange={(v) => pickOption("option1", v, setOption1)}
        />
      )}
      {option2Values.length > 1 && (
        <ChipGroup
          label={optionGroupLabel("option2", option2Values)}
          values={option2Values}
          value={option2 || ""}
          onChange={(v) => pickOption("option2", v, setOption2)}
        />
      )}
      {option3Values.length > 1 && (
        <ChipGroup
          label={optionGroupLabel("option3", option3Values)}
          values={option3Values}
          value={option3 || ""}
          onChange={(v) => pickOption("option3", v, setOption3)}
        />
      )}

      {showVariantChips && (
        <ChipGroup
          label="Size / variant"
          values={filtered.map((v) => v.id)}
          value={selected?.id || ""}
          onChange={setVariantId}
          renderLabel={(id) => {
            const v = filtered.find((x) => x.id === id);
            if (!v) return id;
            const price =
              v.priceOverride != null ? ` · ${formatMoney(v.priceOverride)}` : "";
            return `${variantLabel(v)}${price}`;
          }}
        />
      )}

      {useVariantSelect && (
        <label className="block space-y-2">
          <span className="label">Variant</span>
          <select
            className="input"
            value={selected?.id || ""}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {filtered.slice(0, 200).map((v) => (
              <option key={v.id} value={v.id}>
                {variantLabel(v)}
                {v.priceOverride != null ? ` — ${formatMoney(v.priceOverride)}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-end gap-5">
        <div>
          <span className="label">Quantity</span>
          <div className="qty-control">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
        <p className="font-medium text-lg tracking-wide pb-1">{formatMoney(unitPrice)}</p>
      </div>

      <button
        ref={addBtnRef}
        type="button"
        className="btn-primary w-full md:w-auto"
        onClick={add}
        disabled={!selected}
      >
        Add to bag
      </button>

      <CommerceTrust leadTimeDays={product.leadTimeDays} />

      <div
        className={`sticky-buy ${stickyVisible ? "is-visible" : ""}`}
        aria-hidden={!stickyVisible}
      >
        <div className="min-w-0">
          <p className="text-xs tracking-[0.12em] uppercase text-muted truncate">
            {product.title.length > 42 ? `${product.title.slice(0, 40)}…` : product.title}
          </p>
          <p className="font-medium mt-0.5">{formatMoney(unitPrice)}</p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={add}
          disabled={!selected || !stickyVisible}
          tabIndex={stickyVisible ? 0 : -1}
        >
          Add to bag
        </button>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  values,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
  renderLabel?: (id: string) => string;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2 mt-1">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            className={`option-chip ${value === v ? "is-selected" : ""}`}
            onClick={() => onChange(v)}
            aria-pressed={value === v}
          >
            {renderLabel ? renderLabel(v) : v}
          </button>
        ))}
      </div>
    </div>
  );
}
