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
  type CartLine,
  type ShadeConfig,
} from "@/lib/cart/types";
import { roundMoney } from "@/lib/pricing";

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addProduct: (line: Omit<CartLine, "id" | "kind"> & { kind?: CartLine["kind"] }) => void;
  addConfigured: (input: {
    title: string;
    imageUrl?: string;
    quantity?: number;
    config: ShadeConfig;
  }) => void;
  updateQty: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function uid() {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
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
    setItems((prev) => {
      const existing = prev.find(
        (p) =>
          p.kind === "product" &&
          p.productId &&
          p.productId === line.productId &&
          p.variantId === line.variantId,
      );
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id
            ? { ...p, quantity: p.quantity + (line.quantity || 1) }
            : p,
        );
      }
      return [
        ...prev,
        {
          ...line,
          id: uid(),
          kind: line.kind ?? "product",
          quantity: line.quantity || 1,
        },
      ];
    });
    setDrawerOpen(true);
  }, []);

  const addConfigured: CartContextValue["addConfigured"] = useCallback((input) => {
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        kind: "configured",
        title: input.title,
        imageUrl: input.imageUrl,
        quantity: input.quantity ?? 1,
        unitPrice: input.config.unitPrice,
        config: input.config,
      },
    ]);
    setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = roundMoney(
      items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    );
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      drawerOpen,
      setDrawerOpen,
      addProduct,
      addConfigured,
      updateQty,
      remove,
      clear,
    };
  }, [items, drawerOpen, addProduct, addConfigured, updateQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
