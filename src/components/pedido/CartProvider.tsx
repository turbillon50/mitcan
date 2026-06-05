"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
const KEY = "csn-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

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
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((x) => x.producto_id !== producto_id)
        : prev.map((x) => (x.producto_id === producto_id ? { ...x, cantidad: Math.min(99, cantidad) } : x))
    );
  }, []);

  const remove = useCallback(
    (producto_id: number) => setItems((prev) => prev.filter((x) => x.producto_id !== producto_id)),
    []
  );
  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((a, x) => a + x.cantidad, 0), [items]);
  const subtotal = useMemo(() => items.reduce((a, x) => a + x.precio * x.cantidad, 0), [items]);

  const value = useMemo(
    () => ({ items, ready, add, setCantidad, remove, replaceAll, clear, count, subtotal }),
    [items, ready, add, setCantidad, remove, replaceAll, clear, count, subtotal]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}
