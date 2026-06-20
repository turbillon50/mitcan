"use client";

import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useState,
} from "react";
import { useUser } from "@clerk/nextjs";

export type CartItem = {
  producto_id: number;
  nombre: string;
  precio: number;
  unidad: string;
  imagen_url: string | null;
  cantidad: number;
};

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  add: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  setCantidad: (producto_id: number, cantidad: number) => void;
  remove: (producto_id: number) => void;
  replaceAll: (items: CartItem[]) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

// Key única por usuario — NUNCA se comparte entre cuentas
function cartKey(userId: string | null | undefined) {
  return userId ? `csn-cart-v2-${userId}` : null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Cargar carrito cuando tengamos el userId
  useEffect(() => {
    if (!isLoaded) return;
    const key = cartKey(user?.id);
    if (!key) {
      // Sin sesión: carrito vacío en memoria, no persistir
      setItems([]);
      setReady(true);
      setLoadedKey(null);
      return;
    }
    if (key === loadedKey) return; // ya cargado para este usuario
    try {
      const raw = localStorage.getItem(key);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setLoadedKey(key);
    setReady(true);
  }, [isLoaded, user?.id, loadedKey]);

  // Persistir carrito — solo si hay key de usuario
  useEffect(() => {
    if (!ready || !loadedKey) return;
    try {
      if (items.length === 0) {
        localStorage.removeItem(loadedKey);
      } else {
        localStorage.setItem(loadedKey, JSON.stringify(items));
      }
    } catch {}
  }, [items, ready, loadedKey]);

  const add = useCallback((item: Omit<CartItem, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.producto_id === item.producto_id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], cantidad: Math.min(99, next[i].cantidad + cantidad) };
        return next;
      }
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const setCantidad = useCallback((producto_id: number, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((x) => x.producto_id !== producto_id));
    } else {
      setItems((prev) =>
        prev.map((x) =>
          x.producto_id === producto_id ? { ...x, cantidad: Math.min(99, cantidad) } : x
        )
      );
    }
  }, []);

  const remove = useCallback((producto_id: number) => {
    setItems((prev) => prev.filter((x) => x.producto_id !== producto_id));
  }, []);

  const replaceAll = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    if (loadedKey) {
      try { localStorage.removeItem(loadedKey); } catch {}
    }
  }, [loadedKey]);

  const count = useMemo(() => items.reduce((s, i) => s + i.cantidad, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.precio * i.cantidad, 0), [items]);

  return (
    <Ctx.Provider value={{ items, ready, add, setCantidad, remove, replaceAll, clear, count, subtotal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
