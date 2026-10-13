"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type GuestCartItem = { variantId: string; qty: number };

type GuestCartContextValue = {
  items: GuestCartItem[];
  addItem: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: number;
  /** False until localStorage has been read — an empty `items` before this
   * flips means "not loaded yet", not "genuinely empty". */
  hydrated: boolean;
};

const STORAGE_KEY = "guest_cart";

const GuestCartContext = createContext<GuestCartContextValue | null>(null);

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time client-only hydration from localStorage — must happen after
    // mount since the server has no access to it (would be a hydration mismatch otherwise).
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (variantId: string, qty: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        return prev.map((i) => (i.variantId === variantId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { variantId, qty }];
    });
  };

  const updateQty = (variantId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.variantId !== variantId) : prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
    );
  };

  const removeItem = (variantId: string) => setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  const clear = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <GuestCartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, count, hydrated }}>
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const ctx = useContext(GuestCartContext);
  if (!ctx) throw new Error("useGuestCart must be used within GuestCartProvider");
  return ctx;
}
