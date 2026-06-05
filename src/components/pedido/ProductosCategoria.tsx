"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Check, Beef } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  unidad: string;
  imagen_url: string | null;
  es_nuevo: boolean;
  stock: number | null;
};

export default function ProductosCategoria({
  categoria,
  productos,
}: {
  categoria: string;
  productos: Producto[];
}) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <div>
        <h1 className="section-title text-2xl">{categoria}</h1>
        <p className="text-sm text-on-bg-muted">{productos.length} productos</p>
      </div>

      {productos.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Beef size={36} className="text-primary/50" />
          <p className="text-on-bg-muted">Aún no hay productos en esta categoría.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {productos.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p, index }: { p: Producto; index: number }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const agotado = p.stock !== null && p.stock <= 0;

  const onAdd = () => {
    if (agotado) return;
    add({
      producto_id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      unidad: p.unidad,
      imagen_url: p.imagen_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      className="card flex flex-col overflow-hidden p-0"
    >
      <div className="relative aspect-square w-full bg-surface-2">
        {p.imagen_url ? (
          <Image
            src={p.imagen_url}
            alt={p.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-on-bg-muted/40">
            <Beef size={40} />
          </div>
        )}
        {p.es_nuevo && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-negro">
            NUEVO
          </span>
        )}
        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
            <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-bold">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{p.nombre}</h3>
        {p.descripcion && (
          <p className="line-clamp-2 text-xs text-on-bg-muted">{p.descripcion}</p>
        )}
        {p.stock !== null && p.stock > 0 && p.stock <= 10 && (
          <p className="text-[11px] font-semibold text-amber-500">
            Quedan {p.stock}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-base font-extrabold text-primary">{formatMXN(p.precio)}</p>
            <p className="text-[11px] text-on-bg-muted">por {p.unidad}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onAdd}
            disabled={agotado}
            aria-label={`Agregar ${p.nombre} al carrito`}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-card transition disabled:opacity-40 ${
              added ? "bg-emerald-500" : "bg-primary hover:brightness-110"
            }`}
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
