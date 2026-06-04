"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Video, Pencil, MapPin, TrendingUp, Boxes, AlertTriangle, X } from "lucide-react";
import { formatMXN } from "@/lib/format";
import "mapbox-gl/dist/mapbox-gl.css";

export type C4Suc = {
  id: number;
  nombre: string;
  area: string | null;
  direccion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  activa: boolean;
  lat: number | null;
  lng: number | null;
  valorInventario: number;
  items: number;
  stockBajo: number;
  agotados: number;
  ventas: number;
  pedidos: number;
};

// Status color by inventory health.
function statusOf(s: C4Suc): { color: string; label: string } {
  if (!s.activa) return { color: "#9aa0a6", label: "Inactiva" };
  if (s.agotados > 0) return { color: "#dc2626", label: "Agotados" };
  if (s.stockBajo > 0) return { color: "#E87020", label: "Stock bajo" };
  return { color: "#16a34a", label: "OK" };
}

export default function C4Map({
  token,
  sucursales,
}: {
  token: string | null;
  sucursales: C4Suc[];
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const mapboxRef = useRef<(typeof import("mapbox-gl"))["default"] | null>(null);
  const [sel, setSel] = useState<C4Suc | null>(null);

  const withCoords = useMemo(
    () => sucursales.filter((s) => s.lat != null && s.lng != null),
    [sucursales]
  );

  const totales = useMemo(
    () => ({
      valor: sucursales.reduce((a, s) => a + s.valorInventario, 0),
      ventas: sucursales.reduce((a, s) => a + s.ventas, 0),
      bajo: sucursales.reduce((a, s) => a + s.stockBajo, 0),
      agotados: sucursales.reduce((a, s) => a + s.agotados, 0),
    }),
    [sucursales]
  );

  useEffect(() => {
    if (!token || !elRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !elRef.current) return;
      mapboxRef.current = mapboxgl;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: elRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-104.89, 21.5],
        zoom: 6,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      for (const s of withCoords) {
        const st = statusOf(s);
        const el = document.createElement("div");
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${st.color};border:2px solid #fff;box-shadow:0 0 0 5px ${st.color}33;cursor:pointer`;
        new mapboxgl.Marker(el).setLngLat([s.lng!, s.lat!]).addTo(map);
        el.addEventListener("click", () => {
          setSel(s);
          map.flyTo({ center: [s.lng!, s.lat!], zoom: 13, duration: 700 });
        });
      }
      mapRef.current = map;
      map.once("load", () => {
        if (withCoords.length > 1) {
          const b = new mapboxgl.LngLatBounds();
          withCoords.forEach((s) => b.extend([s.lng!, s.lat!]));
          map.fitBounds(b, { padding: 60, maxZoom: 12, duration: 0 });
        }
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Map + summary */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Valor inventario" value={formatMXN(totales.valor)} icon={<Boxes size={15} />} />
          <Kpi label="Ventas" value={formatMXN(totales.ventas)} icon={<TrendingUp size={15} />} />
          <Kpi label="Stock bajo" value={String(totales.bajo)} icon={<AlertTriangle size={15} />} tone="amber" />
          <Kpi label="Agotados" value={String(totales.agotados)} icon={<AlertTriangle size={15} />} tone="red" />
        </div>
        {token ? (
          <div ref={elRef} className="h-[460px] w-full overflow-hidden rounded-2xl border border-hairline" />
        ) : (
          <div className="flex h-[460px] items-center justify-center rounded-2xl border border-hairline bg-surface-2 text-center text-sm text-on-bg-muted">
            Configura el token de Mapbox (NEXT_PUBLIC_MAPBOX_TOKEN) para ver el mapa.
          </div>
        )}
        {/* Branch chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {sucursales.map((s) => {
            const st = statusOf(s);
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSel(s);
                  if (s.lat != null && s.lng != null)
                    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 13, duration: 700 });
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                  sel?.id === s.id ? "border-primary bg-primary/10 text-primary" : "border-hairline bg-surface-2 text-on-bg-muted"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
                {s.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="card h-fit p-5">
        {!sel ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-on-bg-muted">
            <MapPin size={28} />
            <p className="text-sm">Toca una sucursal en el mapa para ver su detalle, métricas y cámaras.</p>
          </div>
        ) : (
          <C4Detail s={sel} onClose={() => setSel(null)} />
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "amber" | "red";
}) {
  const toneCls = tone === "red" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-primary";
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-on-bg-muted">{label}</p>
        <span className={toneCls}>{icon}</span>
      </div>
      <p className={`mt-1 text-lg font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}

function C4Detail({ s, onClose }: { s: C4Suc; onClose: () => void }) {
  const st = statusOf(s);
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <span
            className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: st.color }}
          >
            {st.label}
          </span>
          <h3 className="text-lg font-bold leading-tight">{s.nombre}</h3>
          {s.direccion && <p className="text-xs text-on-bg-muted">{s.direccion}</p>}
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-on-bg-muted hover:bg-surface-2" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Stat label="Ventas" value={formatMXN(s.ventas)} />
        <Stat label="Pedidos" value={String(s.pedidos)} />
        <Stat label="Valor inv." value={formatMXN(s.valorInventario)} />
        <Stat label="Productos" value={String(s.items)} />
        <Stat label="Stock bajo" value={String(s.stockBajo)} tone={s.stockBajo ? "amber" : undefined} />
        <Stat label="Agotados" value={String(s.agotados)} tone={s.agotados ? "red" : undefined} />
      </div>

      {/* Cameras (foundation for the future C4) */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Video size={15} /> Cámaras
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-on-bg-muted">
            Próximamente
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative flex aspect-video items-center justify-center rounded-lg border border-dashed border-hairline bg-black/30 text-on-bg-muted"
            >
              <Video size={18} className="opacity-40" />
              <span className="absolute bottom-1 left-1.5 text-[9px] uppercase text-on-bg-muted/70">CAM {i}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-on-bg-muted">
          Listo para conectar cámaras (RTSP/HLS) por sucursal cuando las integremos.
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <Link href="/admin/sucursales" className="btn-primary flex-1 justify-center text-sm">
          <Pencil size={14} /> Editar sucursal
        </Link>
        {s.lat != null && s.lng != null && (
          <a
            href={`https://maps.google.com/?q=${s.lat},${s.lng}`}
            target="_blank"
            rel="noopener"
            className="btn-ghost justify-center text-sm"
          >
            <MapPin size={14} /> Mapa
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "amber" | "red" }) {
  const toneCls = tone === "red" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-on-bg";
  return (
    <div className="rounded-lg border border-hairline bg-surface-2 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-on-bg-muted">{label}</p>
      <p className={`font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}
