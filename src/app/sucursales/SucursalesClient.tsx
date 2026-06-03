"use client";

import { useMemo, useState } from "react";
import { Search, Phone, Navigation, Clock } from "lucide-react";
import { formatPhone } from "@/lib/format";

type Sucursal = {
  id: number;
  nombre: string;
  area: string | null;
  direccion: string | null;
  telefono: string | null;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function mapsHref(address: string) {
  return (
    "https://maps.google.com/?q=" +
    encodeURIComponent(address + " Carnes Selectas Nayarit")
  );
}

export default function SucursalesClient({
  sucursales,
  areas,
}: {
  sucursales: Sucursal[];
  areas: { key: string; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("all");

  const visible = useMemo(() => {
    const query = norm(q);
    return sucursales.filter((s) => {
      const matchArea = area === "all" || s.area === area;
      const matchQ =
        !query ||
        norm(`${s.nombre} ${s.direccion ?? ""} ${s.area ?? ""}`).includes(query);
      return matchArea && matchQ;
    });
  }, [sucursales, q, area]);

  const groups = areas
    .map((a) => ({ ...a, items: visible.filter((s) => s.area === a.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-bg-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Buscar por nombre o dirección…"
          className="input pl-11"
          aria-label="Buscar sucursales"
        />
      </div>

      <div className="no-scrollbar -mx-5 mb-7 flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => setArea("all")}
          className={`chip whitespace-nowrap ${area === "all" ? "chip-active" : ""}`}
        >
          Todas
        </button>
        {areas.map((a) => (
          <button
            key={a.key}
            onClick={() => setArea(a.key)}
            className={`chip whitespace-nowrap ${area === a.key ? "chip-active" : ""}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="py-16 text-center text-on-bg-muted">
          No encontramos sucursales para tu búsqueda.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-bold">{g.label}</h2>
                <span className="text-sm text-on-bg-muted">{g.items.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => (
                  <article key={s.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                        {String(s.id).padStart(2, "0")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold leading-tight">{s.nombre}</h3>
                        {s.direccion ? (
                          <p className="mt-1 text-sm leading-snug text-on-bg-muted">
                            {s.direccion}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {s.telefono || s.direccion ? (
                      <div className="mt-3 flex gap-2">
                        {s.telefono && (
                          <a
                            href={`tel:+52${s.telefono.replace(/\D/g, "")}`}
                            className="btn-ghost flex-1 px-2 py-2 text-xs"
                          >
                            <Phone size={14} /> {formatPhone(s.telefono)}
                          </a>
                        )}
                        {s.direccion && (
                          <a
                            href={mapsHref(s.direccion)}
                            target="_blank"
                            rel="noopener"
                            className="btn-ghost flex-1 px-2 py-2 text-xs"
                          >
                            <Navigation size={14} /> Cómo llegar
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <span className="chip text-[10px]">
                          <Clock size={12} /> Direcciones próximamente
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
