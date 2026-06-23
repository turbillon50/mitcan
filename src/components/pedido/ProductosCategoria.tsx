"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Check, Beef, Search, ArrowLeft } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";
import { useT } from "@/components/I18nProvider";

type Producto = {
  id: number; nombre: string; descripcion: string | null;
  precio: number; unidad: string; imagen_url: string | null;
  es_nuevo: boolean; stock: number | null;
};

const PAGE = 24; // productos por página

export default function ProductosCategoria({
  categoria, productos,
}: {
  categoria: string;
  productos: Producto[];
}) {
  const t = useT();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(p => p.nombre.toLowerCase().includes(q));
  }, [busqueda, productos]);

  const visibles = filtrados.slice(0, pagina * PAGE);
  const hayMas = visibles.length < filtrados.length;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/pedido" className="btn-ghost p-2 -ml-1">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="section-title text-2xl">{categoria}</h1>
          <p className="text-sm text-on-bg-muted">
            {busqueda ? `${filtrados.length} / ${productos.length} ${t("cat.products")}` : `${productos.length} ${t("cat.products")}`}
          </p>
        </div>
      </div>

      {/* Buscador */}
      {productos.length > 8 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-bg-muted" />
          <input
            className="input pl-9"
            placeholder={`${t("cat.searchPlaceholder")}`}
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>
      )}

      {filtrados.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Beef size={36} className="text-primary/50" />
          <p className="text-on-bg-muted">
            {busqueda ? `${t("cat.noResults")} "${busqueda}"` : t("rewards.empty")}
          </p>
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="btn-ghost px-4 py-2 text-sm">
              {t("cat.clear")}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibles.map((p, i) => (
          <ProductCard key={p.id} p={p} index={i} />
        ))}
      </div>

      {/* Paginación */}
      {hayMas && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-on-bg-muted">
            {visibles.length} / {filtrados.length} {t("cat.products")}
          </p>
          <button
            onClick={() => setPagina(p => p + 1)}
            className="btn-ghost px-6 py-3"
          >
            {t("cat.seeMore")}
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, index }: { p: Producto; index: number }) {
  const { add, items } = useCart();
  const enCarrito = items.find(i => i.producto_id === p.id);
  const sinStock = p.stock !== null && p.stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`card flex flex-col gap-2 p-3 transition ${sinStock ? "opacity-50" : ""}`}
    >
      {/* Imagen */}
      <div className="relative h-28 w-full overflow-hidden rounded-xl bg-surface-2">
        {p.imagen_url ? (
          <Image src={p.imagen_url} alt={p.nombre} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🥩</div>
        )}
        {p.es_nuevo && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            {t("cat.new")}
          </span>
        )}
        {sinStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2/80">
            <span className="text-xs font-bold text-on-bg-muted">{t("order.noStock")}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="text-sm font-bold leading-snug line-clamp-2">{p.nombre}</h3>
        <p className="mt-0.5 text-sm font-extrabold text-primary">{formatMXN(p.precio)}</p>
        <p className="text-xs text-on-bg-muted">/ {p.unidad}</p>
      </div>

      {/* Botón */}
      <button
        disabled={sinStock}
        onClick={() => !sinStock && add({ producto_id: p.id, nombre: p.nombre, precio: p.precio, unidad: p.unidad, imagen_url: p.imagen_url })}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${
          enCarrito
            ? "bg-emerald-500/10 text-emerald-500"
            : sinStock
            ? "bg-surface-2 text-on-bg-muted cursor-not-allowed"
            : "btn-primary"
        }`}
      >
        {enCarrito ? (
          <><Check size={14} /> {t("order.inCart")} ({enCarrito.cantidad})</>
        ) : (
          <><Plus size={14} /> {t("order.add")}</>
        )}
      </button>
    </motion.div>
  );
}
