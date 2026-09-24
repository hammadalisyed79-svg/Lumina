"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  CART_STORAGE_KEY_LEGACY,
  EDIT_CART_LINE_KEY,
  type CartLine,
  type ShadeConfig,
} from "@/lib/cart/types";
import {
  CART_CHECKOUT_SNAPSHOT_KEY,
  sameConfigured,
} from "@/lib/cart/display";
import { cartLineKey, configuredLineKey, productLineKey } from "@/lib/cart/ids";
import type { ConfiguredSnapshot, ProductSnapshot } from "@/lib/cart/snapshot";
import { snapshotToShadeConfig } from "@/lib/cart/snapshot";
import { roundMoney } from "@/lib/pricing";
import { trackAddToCart } from "@/lib/analytics";

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  hydrated: boolean;
  setDrawerOpen: (open: boolean) => void;
  addProduct: (
    line: Omit<CartLine, "id" | "kind" | "lineKey"> & { kind?: CartLine["kind"] }
  ) => void;
  addConfigured: (input: {
    title: string;
    imageUrl?: string;
    quantity?: number;
    config: ShadeConfig;
    snapshot?: ConfiguredSnapshot;
    /** When editing an existing bag line, replace that line id */
    replaceLineId?: string;
  }) => void;
  updateQty: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  replaceItems: (items: CartLine[]) => void;
  markLineError: (id: string, message: string | undefined) => void;
  beginEditConfigured: (line: CartLine) => void;
  snapshotForCheckout: () => void;
  restoreCheckoutSnapshot: () => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function uid() {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

function migrateLegacy(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const line = item as CartLine;
    const lineKey =
      line.lineKey ||
      cartLineKey({
        kind: line.kind || "product",
        productId: line.productId,
        variantId: line.variantId,
        config: line.config,
      });
    return {
      ...line,
      id: line.id || uid(),
      lineKey,
      kind: line.kind || "product",
      quantity: line.quantity || 1,
      unitPrice: Number(line.unitPrice) || 0,
      title: line.title || "Item",
    };
  });
}

function mergeLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of [...a, ...b]) {
    const existing = map.get(line.lineKey);
    if (!existing) {
      map.set(line.lineKey, { ...line });
      continue;
    }
    map.set(line.lineKey, {
      ...existing,
      ...line,
      id: existing.id,
      quantity: existing.quantity + line.quantity,
      unitPrice: line.unitPrice || existing.unitPrice,
      snapshot: line.snapshot || existing.snapshot,
      validationError: undefined,
    });
  }
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(CART_STORAGE_KEY) ||
        localStorage.getItem(CART_STORAGE_KEY_LEGACY);
      if (raw) {
        const parsed = migrateLegacy(JSON.parse(raw));
        setItems(parsed);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsed));
        localStorage.removeItem(CART_STORAGE_KEY_LEGACY);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addProduct: CartContextValue["addProduct"] = useCallback((line) => {
    const qty = line.quantity || 1;
    const lineKey =
      line.productId != null
        ? productLineKey(line.productId, line.variantId)
        : cartLineKey({ kind: "product", productId: line.productId, variantId: line.variantId });
    setItems((prev) => {
      const existing = prev.find((p) => p.lineKey === lineKey);
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                quantity: p.quantity + qty,
                unitPrice: line.unitPrice,
                title: line.title,
                imageUrl: line.imageUrl || p.imageUrl,
                snapshot: (line.snapshot as ProductSnapshot | undefined) || p.snapshot,
                validationError: undefined,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          ...line,
          id: uid(),
          lineKey,
          kind: line.kind ?? "product",
          quantity: qty,
        },
      ];
    });
    trackAddToCart({
      item_id: line.productId || line.variantId,
      item_name: line.title,
      price: line.unitPrice,
      quantity: qty,
    });
    setDrawerOpen(true);
  }, []);

  const addConfigured: CartContextValue["addConfigured"] = useCallback((input) => {
    const qty = input.quantity ?? 1;
    const lineKey = configuredLineKey(input.config);
    const fromSnap = input.snapshot
      ? snapshotToShadeConfig(input.snapshot)
      : input.config;
    const unitPrice = input.snapshot?.unitPrice ?? input.config.unitPrice;

    setItems((prev) => {
      if (input.replaceLineId) {
        const without = prev.filter((p) => p.id !== input.replaceLineId);
        const existingSame = without.find((p) => p.lineKey === lineKey);
        if (existingSame) {
          return without.map((p) =>
            p.id === existingSame.id
              ? {
                  ...p,
                  quantity: p.quantity + qty,
                  unitPrice,
                  imageUrl: input.imageUrl || p.imageUrl,
                  title: input.title,
                  config: fromSnap,
                  snapshot: input.snapshot || p.snapshot,
                  lineKey,
                  validationError: undefined,
                }
              : p
          );
        }
        return [
          ...without,
          {
            id: input.replaceLineId,
            lineKey,
            kind: "configured" as const,
            title: input.title,
            imageUrl: input.imageUrl,
            quantity: qty,
            unitPrice,
            config: fromSnap,
            snapshot: input.snapshot,
          },
        ];
      }

      const existing = prev.find(
        (p) =>
          p.kind === "configured" &&
          (p.lineKey === lineKey ||
            (p.config && sameConfigured(p.config, input.config)))
      );
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                quantity: p.quantity + qty,
                unitPrice,
                imageUrl: input.imageUrl || p.imageUrl,
                title: input.title,
                config: fromSnap,
                snapshot: input.snapshot || p.snapshot,
                lineKey,
                validationError: undefined,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          id: uid(),
          lineKey,
          kind: "configured",
          title: input.title,
          imageUrl: input.imageUrl,
          quantity: qty,
          unitPrice,
          config: fromSnap,
          snapshot: input.snapshot,
        },
      ];
    });
    trackAddToCart({
      item_name: input.title,
      price: unitPrice,
      quantity: qty,
    });
    setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const replaceItems = useCallback((next: CartLine[]) => {
    setItems(migrateLegacy(next));
  }, []);

  const markLineError = useCallback((id: string, message: string | undefined) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, validationError: message } : p
      )
    );
  }, []);

  const beginEditConfigured = useCallback((line: CartLine) => {
    if (line.kind !== "configured" || !line.config) return;
    try {
      sessionStorage.setItem(
        EDIT_CART_LINE_KEY,
        JSON.stringify({ lineId: line.id, config: line.config })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const snapshotForCheckout = useCallback(() => {
    try {
      sessionStorage.setItem(CART_CHECKOUT_SNAPSHOT_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const restoreCheckoutSnapshot = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(CART_CHECKOUT_SNAPSHOT_KEY);
      if (!raw) return false;
      const snap = migrateLegacy(JSON.parse(raw));
      sessionStorage.removeItem(CART_CHECKOUT_SNAPSHOT_KEY);
      if (!snap.length) return false;
      setItems(snap);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = roundMoney(
      items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    );
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      drawerOpen,
      hydrated,
      setDrawerOpen,
      addProduct,
      addConfigured,
      updateQty,
      remove,
      clear,
      replaceItems,
      markLineError,
      beginEditConfigured,
      snapshotForCheckout,
      restoreCheckoutSnapshot,
    };
  }, [
    items,
    drawerOpen,
    hydrated,
    addProduct,
    addConfigured,
    updateQty,
    remove,
    clear,
    replaceItems,
    markLineError,
    beginEditConfigured,
    snapshotForCheckout,
    restoreCheckoutSnapshot,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { mergeLines };
