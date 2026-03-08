"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Product } from "@/lib/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_BASE = "jovel_cart_v1";

function getStorageKey(userId?: string | null) {
  return `${STORAGE_KEY_BASE}:${userId || "guest"}`;
}

function readStoredCart(storageKey: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items = parsed
      .filter((x): x is { product?: unknown; quantity?: unknown } => !!x && typeof x === "object")
      .map((x) => {
        const obj = x as { product?: unknown; quantity?: unknown };
        const qty = Number(obj.quantity);
        return {
          product: obj.product as Product,
          quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        };
      })
      .filter((i) => !!i.product && typeof i.product === "object" && !!(i.product as Product).id);
    return items;
  } catch {
    return [];
  }
}

function writeStoredCart(storageKey: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // ignore
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

const EMPTY_CART: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedParsed: CartItem[] = EMPTY_CART;
let cachedKey: string | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(storageKey: string) {
  if (typeof window === "undefined") return EMPTY_CART;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey);
  } catch {
    raw = null;
  }
  if (storageKey === cachedKey && raw === cachedRaw) return cachedParsed;
  cachedKey = storageKey;
  cachedRaw = raw;
  cachedParsed = raw ? readStoredCart(storageKey) : EMPTY_CART;
  return cachedParsed;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function setCart(storageKey: string, next: CartItem[]) {
  writeStoredCart(storageKey, next);
  emitChange();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const prevUserIdRef = useRef<string | null>(null);

  const userId = session?.user?.id ? String(session.user.id) : null;
  const storageKey = useMemo(
    () => getStorageKey(userId),
    [userId],
  );

  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (!prev && userId) {
      // Transition from guest -> logged-in. Clear guest cart to avoid cross-account leakage.
      setCart(getStorageKey(null), []);
    }
    prevUserIdRef.current = userId;
  }, [userId]);
  const items = useSyncExternalStore(
    subscribe,
    () => getSnapshot(storageKey),
    getServerSnapshot,
  );

  const addItem = useCallback((product: Product, qty = 1) => {
    const prev = readStoredCart(storageKey);
    const existing = prev.find((i) => i.product.id === product.id);
    const next = existing
      ? prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        )
      : [...prev, { product, quantity: qty }];
    setCart(storageKey, next);
  }, [storageKey]);

  const removeItem = useCallback((productId: string) => {
    const prev = readStoredCart(storageKey);
    setCart(storageKey, prev.filter((i) => i.product.id !== productId));
  }, [storageKey]);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    const prev = readStoredCart(storageKey);
    if (qty <= 0) {
      setCart(storageKey, prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart(
      storageKey,
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i,
      ),
    );
  }, [storageKey]);

  const clearCart = useCallback(() => setCart(storageKey, []), [storageKey]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
