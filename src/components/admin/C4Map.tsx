"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Video, Pencil, MapPin, TrendingUp, Boxes, AlertTriangle, X, Boxes as BoxIcon,
  Plus, Trash2, Loader2,
} from "lucide-react";
import { formatMXN } from "@/lib/format";
import LocationPicker from "@/components/admin/LocationPicker";
import { saveSucursal, saveCamaras, type Camara } from "@/app/admin/actions";
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

function statusOf(s: C4Suc): { color: string; label: string } {
  if (!s.activa) return { color: "#9aa0a6", label: "Inactiva" };
  if (s.agotados > 0) return { color: "#dc2626", label: "Agotados" };
  if (s.stockBajo > 0) return { color: "#E87020", label: "Stock bajo" };
  return { color: "#16a34a", label: "OK" };
}

export default function C4Map({
  token,
  sucursales,
  camaras,
}: {
  token: string | null;
  sucursales: C4Suc[];
  camaras: Record<number, Camara[]>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
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
      const fit = () => {
        map.resize();
        if (withCoords.length > 1) {
          const b = new mapboxgl.LngLatBounds();
          withCoords.forEach((s) => b.extend([s.lng!, s.lat!]));
          map.fitBounds(b, { padding: 40, maxZoom: 12, duration: 0 });
        }
      };
      map.once("load", fit);
      // Mobile: the container often lays out after init -> force a resize.
      setTimeout(() => map.resize(), 300);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_minmax(320px,380px)]">
      {/* Map + summary */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Kpi label="Valor inventario" value={formatMXN(totales.valor)} icon={<Boxes size={14} />} />
          <Kpi label="Ventas" value={formatMXN(totales.ventas)} icon={<TrendingUp size={14} />} />
          <Kpi label="Stock bajo" value={String(totales.bajo)} icon={<AlertTriangle size={14} />} tone="amber" />
          <Kpi label="Agotados" value={String(totales.agotados)} icon={<AlertTriangle size={14} />} tone="red" />
        </div>
        {token ? (
          <div ref={elRef} className="h-[300px] w-full overflow-hidden rounded-2xl border border-hairline sm:h-[440px]" />
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-2xl border border-hairline bg-surface-2 p-4 text-center text-sm text-on-bg-muted">
            Configura el token de Mapbox (NEXT_PUBLIC_MAPBOX_TOKEN) para ver el mapa.
          </div>
        )}
        {/* Branch chips */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
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
      <div className="card h-fit min-w-0 p-4 sm:p-5">
        {!sel ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-on-bg-muted">
            <MapPin size={28} />
            <p className="text-sm">Toca una sucursal para ver su detalle, métricas y cámaras.</p>
          </div>
        ) : (
          <C4Detail
            s={sel}
            token={token}
            camaras={camaras[sel.id] ?? []}
            onClose={() => setSel(null)}
          />
        )}
      </div>
    </div>
  );
}

function Kpi({
  label, value, icon, tone,
}: { label: string; value: string; icon: React.ReactNode; tone?: "amber" | "red" }) {
  const toneCls = tone === "red" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-primary";
  return (
    <div className="card min-w-0 p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[10px] uppercase tracking-wide text-on-bg-muted">{label}</p>
        <span className={`shrink-0 ${toneCls}`}>{icon}</span>
      </div>
      <p className={`mt-1 truncate text-base font-bold sm:text-lg ${toneCls}`}>{value}</p>
    </div>
  );
}

function C4Detail({
  s, token, camaras, onClose,
}: { s: C4Suc; token: string | null; camaras: Camara[]; onClose: () => void }) {
  const st = statusOf(s);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form action={saveSucursal} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Editar sucursal</h3>
          <button type="button" onClick={() => setEditing(false)} className="rounded-full p-1 text-on-bg-muted hover:bg-surface-2" aria-label="Cancelar">
            <X size={16} />
          </button>
        </div>
        <input type="hidden" name="id" value={s.id} />
        <input type="hidden" name="area" value={s.area ?? "tepic"} />
        <div>
          <label className="label">Nombre</label>
          <input name="nombre" defaultValue={s.nombre} className="input" required />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input name="direccion" defaultValue={s.direccion ?? ""} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Teléfono</label>
            <input name="telefono" defaultValue={s.telefono ?? ""} className="input" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input name="whatsapp" defaultValue={s.whatsapp ?? ""} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Ubicación (arrastra el pin)</label>
          <LocationPicker token={token} defaultLat={s.lat} defaultLng={s.lng} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activa" defaultChecked={s.activa} /> Activa
        </label>
        <button type="submit" className="btn-primary justify-center">Guardar cambios</button>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: st.color }}>
            {st.label}
          </span>
          <h3 className="text-lg font-bold leading-tight">{s.nombre}</h3>
          {s.direccion && <p className="text-xs text-on-bg-muted">{s.direccion}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 rounded-full p-1 text-on-bg-muted hover:bg-surface-2" aria-label="Cerrar">
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

      <CamaraPanel sucursalId={s.id} initial={camaras} />

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setEditing(true)} className="btn-primary flex-1 justify-center text-sm">
          <Pencil size={14} /> Editar
        </button>
        <Link href={`/admin/inventario?sucursal=${s.id}`} className="btn-ghost justify-center text-sm">
          <BoxIcon size={14} /> Inventario
        </Link>
      </div>
    </div>
  );
}

function isVideo(url: string) {
  return /\.(m3u8|mp4|webm|mov)(\?|$)/i.test(url);
}

function CamaraPanel({ sucursalId, initial }: { sucursalId: number; initial: Camara[] }) {
  const [cams, setCams] = useState<Camara[]>(initial);
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  // Reset when switching branch.
  useEffect(() => { setCams(initial); setIdx(0); setAdding(false); }, [initial, sucursalId]);

  const persist = (next: Camara[]) =>
    start(async () => { await saveCamaras(sucursalId, next); });

  function addCam() {
    if (!url.trim()) return;
    const next = [...cams, { nombre: nombre.trim() || `Cámara ${cams.length + 1}`, url: url.trim() }];
    setCams(next); setIdx(next.length - 1); setNombre(""); setUrl(""); setAdding(false);
    persist(next);
  }
  function removeCam(i: number) {
    const next = cams.filter((_, j) => j !== i);
    setCams(next); setIdx((p) => Math.max(0, Math.min(p, next.length - 1)));
    persist(next);
  }

  const cur = cams[idx];

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Video size={15} /> Cámaras
        {pending && <Loader2 size={13} className="animate-spin text-on-bg-muted" />}
        <button onClick={() => setAdding((a) => !a)} className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[11px] font-medium text-on-bg-muted hover:text-primary">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {/* Main view */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-hairline bg-black">
        {cur ? (
          isVideo(cur.url) ? (
            <video src={cur.url} controls playsInline muted className="h-full w-full object-contain" />
          ) : (
            <iframe src={cur.url} className="h-full w-full" allow="autoplay; fullscreen" />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-on-bg-muted">
            <Video size={22} className="opacity-40" />
            <span className="text-[11px]">Sin cámaras. Toca “Agregar”.</span>
          </div>
        )}
      </div>

      {/* Selector de cámaras */}
      {cams.length > 0 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {cams.map((c, i) => (
            <div key={i} className="relative shrink-0">
              <button
                onClick={() => setIdx(i)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                  i === idx ? "border-primary bg-primary/10 text-primary" : "border-hairline bg-surface-2 text-on-bg-muted"
                }`}
              >
                <Video size={12} /> {c.nombre}
              </button>
              <button
                onClick={() => removeCam(i)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white"
                aria-label="Quitar cámara"
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-hairline bg-surface-2 p-2.5">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (ej. Caja, Entrada)" className="input py-1.5 text-xs" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL del stream (HLS .m3u8, MP4 o embed)" className="input py-1.5 text-xs" />
          <div className="flex gap-2">
            <button onClick={addCam} className="btn-primary flex-1 justify-center py-1.5 text-xs">Guardar cámara</button>
            <button onClick={() => setAdding(false)} className="btn-ghost py-1.5 text-xs">Cancelar</button>
          </div>
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-on-bg-muted">
        Pega la URL del stream de tu cámara (RTSP convertido a HLS/.m3u8, MP4, o liga embed).
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "amber" | "red" }) {
  const toneCls = tone === "red" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-on-bg";
  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-surface-2 px-3 py-2">
      <p className="truncate text-[10px] uppercase tracking-wide text-on-bg-muted">{label}</p>
      <p className={`truncate font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}
