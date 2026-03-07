"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem } from "./types";

const STORAGE_KEY = "hokoro-store-cart";
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredCartPayload = {
  version: 1;
  expiresAt: number;
  items: CartItem[];
};

const isValidTimestamp = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0;

const sanitizeItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const productId = (item as { productId?: unknown }).productId;
      const quantity = (item as { quantity?: unknown }).quantity;
      if (typeof productId !== "string") return null;
      if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { productId, quantity: Math.floor(quantity) } satisfies CartItem;
    })
    .filter((item): item is CartItem => item !== null);
};

const readCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  const clear = () => window.localStorage.removeItem(STORAGE_KEY);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;

    // Legacy support: old format stored an array directly.
    if (Array.isArray(parsed)) {
      return sanitizeItems(parsed);
    }

    if (!parsed || typeof parsed !== "object") {
      clear();
      return [];
    }
    const payload = parsed as Partial<StoredCartPayload>;
    if (payload.version !== 1) {
      clear();
      return [];
    }
    if (!isValidTimestamp(payload.expiresAt)) {
      clear();
      return [];
    }
    if (payload.expiresAt < Date.now()) {
      clear();
      return [];
    }
    const sanitized = sanitizeItems(payload.items);
    if (sanitized.length !== (Array.isArray(payload.items) ? payload.items.length : 0)) {
      clear();
      return [];
    }
    return sanitized;
  } catch {
    clear();
    return [];
  }
};

const writeCartToStorage = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  const payload: StoredCartPayload = {
    version: 1,
    expiresAt: Date.now() + CART_TTL_MS,
    items,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export function useStoreCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    writeCartToStorage(items);
  }, [items, isHydrated]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const setItemQuantity = useCallback((productId: string, quantity: number) => {
    const nextQty = Math.max(0, Math.floor(quantity));
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (nextQty === 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      if (!existing) {
        return [...prev, { productId, quantity: nextQty }];
      }
      return prev.map((item) => (item.productId === productId ? { ...item, quantity: nextQty } : item));
    });
  }, []);

  const addItem = useCallback((productId: string, quantity: number) => {
    const addQty = Math.max(1, Math.floor(quantity));
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (!existing) {
        return [...prev, { productId, quantity: addQty }];
      }
      return prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + addQty } : item));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    itemCount,
    isHydrated,
    setItemQuantity,
    addItem,
    removeItem,
    clearCart,
  };
}
