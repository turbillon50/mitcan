"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Beef, Plus } from "lucide-react";
import { formatMXN } from "@/lib/format";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  unidad: string | null;
  imagen_url: string | null;
  categoria_id: number | null;
  categoria: { id: number; nombre: string } | null;
};
type Categoria = { id: number; nombre: string };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function CatalogClient({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");

  const filtered = useMemo(() => {
    const query = norm(q);
    return productos.filter((p) => {
      const matchCat = cat === "all" || p.categoria_id === cat;
      const matchQ =
        !query ||
        norm(`${p.nombre} ${p.descripcion ?? ""} ${p.categoria?.nombre ?? ""}`).includes(query);
      return matchCat && matchQ;
    });
  }, [productos, q, cat]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-bg-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Buscar productos…"
          className="input pl-11"
          aria-label="Buscar productos"
        />
      </div>

      {/* Category chips */}
      <div className="no-scrollbar -mx-5 mb-7 flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => setCat("all")}
          className={`chip whitespace-nowrap ${cat === "all" ? "chip-active" : ""}`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`chip whitespace-nowrap ${cat === c.id ? "chip-active" : ""}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-on-bg-muted">
          No encontramos productos para tu búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="card group overflow-hidden transition hover:border-primary/30"
            >
              <div className="relative h-36 overflow-hidden bg-surface-2">
                {p.imagen_url ? (
                  <Image
                    src={p.imagen_url}
                    alt={p.nombre}
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary/40">
                    <Beef size={40} />
                  </div>
                )}
              </div>
              <div className="flex flex-col p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-on-bg-muted">
                  {p.categoria?.nombre ?? "Producto"}
                </p>
                <h3 className="font-bold leading-tight">{p.nombre}</h3>
                {p.descripcion && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-on-bg-muted">
                    {p.descripcion}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {formatMXN(p.precio)}
                    <span className="text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Plus size={16} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
