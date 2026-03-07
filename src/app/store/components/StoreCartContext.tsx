"use client";

import { createContext, useContext } from "react";
import type { CartItem } from "../types";
import { useStoreCart } from "../use-store-cart";

type StoreCartContextValue = {
  items: CartItem[];
  itemCount: number;
  isHydrated: boolean;
  setItemQuantity: (productId: string, quantity: number) => void;
  addItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const cart = useStoreCart();
  return <StoreCartContext.Provider value={cart}>{children}</StoreCartContext.Provider>;
}

export function useStoreCartContext() {
  const context = useContext(StoreCartContext);
  if (!context) {
    throw new Error("useStoreCartContext must be used within StoreCartProvider");
  }
  return context;
}
