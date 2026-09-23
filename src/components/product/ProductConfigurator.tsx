"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { calculateUnitPrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";

type Option = { id: string; slug: string; name: string; priceMod: number };

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
    variants: {
      id: string;
      title: string;
      sku: string;
      priceOverride: number | null;
      fabricId: string | null;
      sizeId: string | null;
      liningId: string | null;
      fittingId: string | null;
    }[];
  };
};

export function ProductConfigurator({ product }: Props) {
  const { addProduct, addConfigured } = useCart();
  const [fabrics, setFabrics] = useState<Option[]>([]);
  const [sizes, setSizes] = useState<Option[]>([]);
  const [linings, setLinings] = useState<Option[]>([]);
  const [fittings, setFittings] = useState<Option[]>([]);
  const [shapes, setShapes] = useState<{ key: string; name: string; basePrice: number }[]>([]);
  const [fabricId, setFabricId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [liningId, setLiningId] = useState("");
  const [fittingId, setFittingId] = useState("");
  const [shapeKey, setShapeKey] = useState(product.shapeKey || "drum");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config-options")
      .then((r) => r.json())
      .then((data) => {
        setFabrics(data.fabrics);
        setSizes(data.sizes);
        setLinings(data.linings);
        setFittings(data.fittings);
        setShapes(data.shapes);
        setFabricId(data.fabrics[0]?.id || "");
        setSizeId(data.sizes[1]?.id || data.sizes[0]?.id || "");
        setLiningId(data.linings[0]?.id || "");
        setFittingId(data.fittings[0]?.id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const fabric = fabrics.find((f) => f.id === fabricId);
  const size = sizes.find((s) => s.id === sizeId);
  const lining = linings.find((l) => l.id === liningId);
  const fitting = fittings.find((f) => f.id === fittingId);
  const shape = shapes.find((s) => s.key === shapeKey);

  const unitPrice = useMemo(() => {
    if (!product.configEnabled) {
      const v = product.variants[0];
      return v?.priceOverride ?? product.basePrice;
    }
    return calculateUnitPrice({
      basePrice: shape?.basePrice ?? product.basePrice,
      fabricMod: fabric?.priceMod,
      sizeMod: size?.priceMod,
      liningMod: lining?.priceMod,
      fittingMod: fitting?.priceMod,
    });
  }, [product, shape, fabric, size, lining, fitting]);

  function add() {
    if (!product.configEnabled) {
      const v = product.variants[0];
      addProduct({
        productId: product.id,
        variantId: v?.id,
        slug: product.slug,
        title: product.title,
        imageUrl: product.imageUrl,
        quantity: qty,
        unitPrice,
      });
      return;
    }
    if (!fabric || !size || !lining || !fitting || !shape) return;
    addConfigured({
      title: `${shape.name} shade · ${fabric.name}`,
      imageUrl: product.imageUrl,
      quantity: qty,
      config: {
        shapeKey: shape.key,
        shapeName: shape.name,
        fabricSlug: fabric.slug,
        fabricName: fabric.name,
        sizeSlug: size.slug,
        sizeName: size.name,
        liningSlug: lining.slug,
        liningName: lining.name,
        fittingSlug: fitting.slug,
        fittingName: fitting.name,
        unitPrice,
      },
    });
  }

  if (loading) return <p className="text-sm text-[color:var(--muted)]">Loading options…</p>;

  return (
    <div className="space-y-5 border-t border-[color:var(--line)] pt-6">
      {product.configEnabled && (
        <>
          <Field label="Shape">
            <select className="input" value={shapeKey} onChange={(e) => setShapeKey(e.target.value)}>
              {shapes.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fabric">
            <select className="input" value={fabricId} onChange={(e) => setFabricId(e.target.value)}>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.priceMod ? ` (+£${f.priceMod})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <select className="input" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.priceMod ? ` (+£${s.priceMod})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lining">
            <select className="input" value={liningId} onChange={(e) => setLiningId(e.target.value)}>
              {linings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.priceMod ? ` (+£${l.priceMod})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fitting">
            <select className="input" value={fittingId} onChange={(e) => setFittingId(e.target.value)}>
              {fittings.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.priceMod ? ` (+£${f.priceMod})` : ""}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center border border-[color:var(--line)]">
          <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            −
          </button>
          <span className="px-3">{qty}</span>
          <button type="button" className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </label>
        <p className="font-medium">{formatMoney(unitPrice)}</p>
      </div>

      <button type="button" className="btn-primary w-full md:w-auto" onClick={add}>
        Add to bag
      </button>
      <p className="text-xs text-[color:var(--muted)]">
        Pricing is recalculated securely at checkout.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
