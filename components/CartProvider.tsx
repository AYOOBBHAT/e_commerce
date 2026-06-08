'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { CartItem, CartItemMeta, CartValidationResponse } from '@/lib/cart/types';
import { parseCartStorage, toValidationPayload } from '@/lib/cart/identity';

export type { CartItem } from '@/lib/cart/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  syncCart: () => Promise<CartValidationResponse | null>;
  isSyncing: boolean;
  cartReady: boolean;
  checkoutBlocked: boolean;
  removedItemsNotice: string | null;
  itemsMeta: Record<string, CartItemMeta>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

async function fetchCartValidation(items: CartItem[]): Promise<CartValidationResponse> {
  const res = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: toValidationPayload(items) }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Cart validation failed');
  }

  return res.json();
}

function cartsEqual(a: CartItem[], b: CartItem[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [checkoutBlocked, setCheckoutBlocked] = useState(false);
  const [removedItemsNotice, setRemovedItemsNotice] = useState<string | null>(null);
  const [itemsMeta, setItemsMeta] = useState<Record<string, CartItemMeta>>({});
  const cartRef = useRef<CartItem[]>([]);
  const syncInFlight = useRef(false);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    setCart(parseCartStorage(localStorage.getItem('cart')));
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, cartReady]);

  const syncCart = useCallback(async (): Promise<CartValidationResponse | null> => {
    const snapshot = cartRef.current;

    if (!snapshot.length) {
      setCheckoutBlocked(false);
      setRemovedItemsNotice(null);
      setItemsMeta({});
      return null;
    }

    if (syncInFlight.current) return null;
    syncInFlight.current = true;
    setIsSyncing(true);

    try {
      const result = await fetchCartValidation(snapshot);
      if (!cartsEqual(snapshot, result.items)) {
        setCart(result.items);
      }
      setCheckoutBlocked(result.checkoutBlocked);
      setItemsMeta(result.itemsMeta);
      setRemovedItemsNotice(result.globalMessage ?? null);
      return result;
    } catch (error) {
      console.error('[CartProvider] sync failed', error);
      return null;
    } finally {
      syncInFlight.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!cartReady) return;

    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      void syncCart();
      return;
    }

    const timer = window.setTimeout(() => {
      void syncCart();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [cart, cartReady, syncCart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...item,
                quantity: i.quantity + item.quantity,
              }
            : i,
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    setItemsMeta((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutBlocked(false);
    setRemovedItemsNotice(null);
    setItemsMeta({});
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        syncCart,
        isSyncing,
        cartReady,
        checkoutBlocked,
        removedItemsNotice,
        itemsMeta,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
