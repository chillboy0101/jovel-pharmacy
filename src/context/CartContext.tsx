"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "jovel_cart_v1";

function safeParseItems(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        const obj = x as Partial<CartItem>;
        if (!obj.product || typeof obj.quantity !== "number") return null;
        return { product: obj.product as Product, quantity: obj.quantity };
      })
      .filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(safeParseItems(typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (product, quantity = 1) => {
      const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.product.id === product.id);
        if (idx === -1) return [...prev, { product, quantity: qty }];
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      });
    };

    const removeItem: CartContextValue["removeItem"] = (productId) => {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const setQuantity: CartContextValue["setQuantity"] = (productId, quantity) => {
      const qty = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
      setItems((prev) => {
        if (qty === 0) return prev.filter((i) => i.product.id !== productId);
        return prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i));
      });
    };

    const clear: CartContextValue["clear"] = () => setItems([]);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

    return {
      items,
      addItem,
      removeItem,
      setQuantity,
      clear,
      totalItems,
      subtotal,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
