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

type StorageKind = "local" | "session";

function getWebStorage(kind: StorageKind) {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function storageKindForUser(userId: string | null): StorageKind {
  return userId ? "local" : "session";
}

function readStoredCart(storageKind: StorageKind, storageKey: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const storage = getWebStorage(storageKind);
    const raw = storage?.getItem(storageKey) ?? null;
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

function writeStoredCart(storageKind: StorageKind, storageKey: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    const storage = getWebStorage(storageKind);
    storage?.setItem(storageKey, JSON.stringify(items));
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
let cachedStorageKind: StorageKind | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(storageKind: StorageKind, storageKey: string) {
  if (typeof window === "undefined") return EMPTY_CART;
  let raw: string | null = null;
  try {
    const storage = getWebStorage(storageKind);
    raw = storage?.getItem(storageKey) ?? null;
  } catch {
    raw = null;
  }
  if (storageKey === cachedKey && storageKind === cachedStorageKind && raw === cachedRaw) return cachedParsed;
  cachedKey = storageKey;
  cachedStorageKind = storageKind;
  cachedRaw = raw;
  cachedParsed = raw ? readStoredCart(storageKind, storageKey) : EMPTY_CART;
  return cachedParsed;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function setCart(storageKind: StorageKind, storageKey: string, next: CartItem[]) {
  writeStoredCart(storageKind, storageKey, next);
  emitChange();
}

function clearStorageKey(storageKind: StorageKind, storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    const storage = getWebStorage(storageKind);
    storage?.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const prevUserIdRef = useRef<string | null>(null);

  const userId = session?.user?.id ? String(session.user.id) : null;
  const storageKind = useMemo(() => storageKindForUser(userId), [userId]);
  const storageKey = useMemo(
    () => getStorageKey(userId),
    [userId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (userId) return;

    // One-time migration (Option A): if a guest cart exists in localStorage (old behavior),
    // move it into sessionStorage so it expires on browser close.
    const guestKey = getStorageKey(null);
    const local = getWebStorage("local");
    const session = getWebStorage("session");
    if (!local || !session) return;

    try {
      const localRaw = local.getItem(guestKey);
      const sessionRaw = session.getItem(guestKey);
      if (localRaw && !sessionRaw) {
        session.setItem(guestKey, localRaw);
        local.removeItem(guestKey);
        emitChange();
      } else if (localRaw && sessionRaw) {
        // If both exist, prefer sessionStorage and remove the stale localStorage guest cart.
        local.removeItem(guestKey);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (!prev && userId) {
      // Transition from guest -> logged-in. Clear guest cart to avoid cross-account leakage.
      const guestKey = getStorageKey(null);
      setCart("session", guestKey, []);
      clearStorageKey("local", guestKey);
    }
    prevUserIdRef.current = userId;
  }, [userId]);
  const items = useSyncExternalStore(
    subscribe,
    () => getSnapshot(storageKind, storageKey),
    getServerSnapshot,
  );

  const addItem = useCallback((product: Product, qty = 1) => {
    const prev = readStoredCart(storageKind, storageKey);
    const existing = prev.find((i) => i.product.id === product.id);
    const next = existing
      ? prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        )
      : [...prev, { product, quantity: qty }];
    setCart(storageKind, storageKey, next);
  }, [storageKey, storageKind]);

  const removeItem = useCallback((productId: string) => {
    const prev = readStoredCart(storageKind, storageKey);
    setCart(storageKind, storageKey, prev.filter((i) => i.product.id !== productId));
  }, [storageKey, storageKind]);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    const prev = readStoredCart(storageKind, storageKey);
    if (qty <= 0) {
      setCart(storageKind, storageKey, prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart(
      storageKind,
      storageKey,
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i,
      ),
    );
  }, [storageKey, storageKind]);

  const clearCart = useCallback(() => setCart(storageKind, storageKey, []), [storageKind, storageKey]);

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
