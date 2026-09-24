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
import { useSession } from "next-auth/react";
import { WISHLIST_STORAGE_KEY } from "@/lib/cart/types";

type WishlistContextValue = {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  replaceIds: (serverIds: string[]) => void;
  mergeServer: (serverIds: string[]) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const replaceIds = useCallback((serverIds: string[]) => {
    setIds(Array.from(new Set(serverIds)));
  }, []);

  const mergeServer = useCallback((serverIds: string[]) => {
    setIds((prev) => Array.from(new Set([...prev, ...serverIds])));
  }, []);

  const toggle = useCallback(
    (productId: string) => {
      setIds((prev) => {
        const next = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        return next;
      });

      if (status === "authenticated") {
        fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, action: "toggle" }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.ids)) replaceIds(data.ids);
          })
          .catch(() => undefined);
      }
    },
    [status, replaceIds]
  );

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, has, toggle, replaceIds, mergeServer, clear }),
    [ids, has, toggle, replaceIds, mergeServer, clear]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
