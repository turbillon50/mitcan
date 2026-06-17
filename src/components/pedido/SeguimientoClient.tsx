"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox, ChefHat, Package, Bike, PartyPopper, Phone, Star, Loader2, XCircle,
} from "lucide-react";
import { formatMXN, formatDateTime } from "@/lib/format";
import { ESTADOS_ONLINE, TEL_PEDIDOS, TEL_PEDIDOS_DISPLAY } from "@/lib/online-const";

const ICONS = [Inbox, ChefHat, Package, Bike, PartyPopper];
const LABELS: Record<string, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  entregado_repartidor: "Con repartidor",
  en_camino: "En camino",
  ha_llegado: "Ha llegado",
};

const SUC_LAT = 21.475156;
const SUC_LNG = -104.857818;
const SUC_NOMBRE = "Nayarabastos";

type Pedido = {
  id: number; folio: string; estado: string;
  subtotal: number; envio: number; total: number; puntos_ganados: number;
  direccion_entrega: string | null; repartidor: string | null;
  entregado_at: string | null; created_at: string;
  items: { id: number; cantidad: number; subtotal: number; producto: { nombre: string } | null }[];
  eventos: { id: number; estado: string; created_at: string }[];
  encuesta: { id: number } | null;
};

function MapaSeguimiento({
  mapboxToken, estado, direccionEntrega, destLat, destLng,
}: {
  mapboxToken: string; estado: string;
  direccionEntrega: string | null;
  destLat: number | null; destLng: number | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<unknown>(null);

  const enRuta = ["entregado_repartidor", "en_camino", "ha_llegado"].includes(estado);
  const entregado = estado === "ha_llegado";
  const enCamino = estado === "en_camino";

  useEffect(() => {
    if (!mapboxToken || !mapRef.current || mapInst.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;
      (mapboxgl as unknown as { accessToken: string }).accessToken = mapboxToken;

      type MBMap = {
        resize: () => void;
        addLayer: (l: unknown) => void;
        addSource: (id: string, s: unknown) => void;
        on: (ev: string, fn: () => void) => void;
        fitBounds: (b: unknown, o: unknown) => void;
      };
      type MBMapCtor = new (o: unknown) => MBMap;
      type MBMarkerCtor = new (el?: HTMLElement) => {
        setLngLat: (c: [number, number]) => { addTo: (m: unknown) => void }
      };
      type LngLatBoundsCtor = new () => { extend: (c: [number, number]) => void };

      const hasDestino = destLat != null && destLng != null;

      // Centro: entre sucursal y destino si lo tenemos, sino solo sucursal
      const cLat = hasDestino ? (SUC_LAT + destLat!) / 2 : SUC_LAT;
      const cLng = hasDestino ? (SUC_LNG + destLng!) / 2 : SUC_LNG;

      const MapCtor = (mapboxgl as unknown as { Map: MBMapCtor }).Map;
      const map = new MapCtor({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [cLng, cLat],
        zoom: hasDestino ? 12 : 14,
      });
      mapInst.current = map;
      setTimeout(() => (map as MBMap).resize(), 200);

      const MarkerCtor = (mapboxgl as unknown as { Marker: MBMarkerCtor }).Marker;

      // Marcador sucursal — azul
      const elS = document.createElement("div");
      elS.innerHTML = `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.25)"></div>`;
      new MarkerCtor(elS.firstChild as HTMLElement).setLngLat([SUC_LNG, SUC_LAT]).addTo(map);

      // Marcador destino — rojo (si tenemos coords geocodificadas)
      if (hasDestino) {
        const elD = document.createElement("div");
        elD.innerHTML = `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(239,68,68,.25)"></div>`;
        new MarkerCtor(elD.firstChild as HTMLElement).setLngLat([destLng!, destLat!]).addTo(map);
      }

      // Marcador repartidor — naranja pulsando (si está en ruta)
      if (enRuta && !entregado) {
        // Posición estimada: 40% del camino hacia el destino
        const rLat = hasDestino ? SUC_LAT + (destLat! - SUC_LAT) * 0.4 : SUC_LAT + 0.004;
        const rLng = hasDestino ? SUC_LNG + (destLng! - SUC_LNG) * 0.4 : SUC_LNG + 0.004;
        const elR = document.createElement("div");
        const color = enCamino ? "#f97316" : "#f59e0b";
        elR.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 6px ${color}44;cursor:pointer`;
        if (enCamino) {
          elR.animate([
            { boxShadow: `0 0 0 4px ${color}55` },
            { boxShadow: `0 0 0 10px ${color}00` },
          ], { duration: 1200, iterations: Infinity });
        }
        new MarkerCtor(elR).setLngLat([rLng, rLat]).addTo(map);
      }

      // Línea de ruta
      map.on("load", () => {
        const coords: [number, number][] = [[SUC_LNG, SUC_LAT]];
        if (enRuta && !entregado) {
          const rLat = hasDestino ? SUC_LAT + (destLat! - SUC_LAT) * 0.4 : SUC_LAT + 0.004;
          const rLng = hasDestino ? SUC_LNG + (destLng! - SUC_LNG) * 0.4 : SUC_LNG + 0.004;
          coords.push([rLng, rLat]);
        }
        if (hasDestino) coords.push([destLng!, destLat!]);

        if (coords.length > 1) {
          const lineColor = entregado ? "#10b981" : enCamino ? "#f97316" : "#6366f1";
          map.addSource("ruta", {
            type: "geojson",
            data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } },
          });
          map.addLayer({
            id: "ruta-line",
            type: "line",
            source: "ruta",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": lineColor, "line-width": 3, "line-dasharray": [2, 1.5] },
          });
        }

        // Ajustar zoom para mostrar sucursal + destino
        if (hasDestino) {
          const BoundsCtor = (mapboxgl as unknown as { LngLatBounds: LngLatBoundsCtor }).LngLatBounds;
          const bounds = new BoundsCtor();
          bounds.extend([SUC_LNG, SUC_LAT]);
          bounds.extend([destLng!, destLat!]);
          map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 500 });
        }
      });
    })();
    return () => { cancelled = true; };
  }, [mapboxToken, estado, enRuta, entregado, enCamino, destLat, destLng]);

  const estadoConfig = {
    recibido: { color: "text-blue-400", msg: "📋 Pedido recibido" },
    en_preparacion: { color: "text-indigo-400", msg: "🔪 En preparación" },
    entregado_repartidor: { color: "text-amber-400", msg: "📦 Con repartidor" },
    en_camino: { color: "text-orange-400", msg: "🛵 En camino a tu domicilio" },
    ha_llegado: { color: "text-emerald-400", msg: "✓ Pedido entregado" },
  }[estado] ?? { color: "text-on-bg-muted", msg: estado };

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline">
      <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
          <span className="font-medium">{SUC_NOMBRE}</span>
          {destLat && (
            <>
              <span className="text-on-bg-muted">→</span>
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
              <span className="font-medium">Tu dirección</span>
            </>
          )}
        </div>
        <span className={`text-xs font-bold ${estadoConfig.color}`}>{estadoConfig.msg}</span>
      </div>

      <div ref={mapRef} style={{ height: "220px", width: "100%" }} />

      {direccionEntrega && (
        <div className="border-t border-hairline bg-surface-2 px-4 py-2.5 text-xs text-on-bg-muted">
          📍 {direccionEntrega}
        </div>
      )}
    </section>
  );
}

export default function SeguimientoClient({
  folio, mapboxToken, destLat, destLng,
}: {
  folio: string; mapboxToken: string;
  destLat: number | null; destLng: number | null;
}) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/track/${folio}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No encontramos este pedido");
      setPedido(await res.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [folio]);

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [load]);

  if (error) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <XCircle size={36} className="text-rose-400" />
        <p className="text-on-bg-muted">{error}</p>
        <Link href="/pedido" className="btn-primary px-6 py-3">Ir a pedido en línea</Link>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <div className="card h-40 animate-pulse bg-surface-2" />
        <div className="card h-52 animate-pulse bg-surface-2" />
        <div className="card h-40 animate-pulse bg-surface-2" />
      </div>
    );
  }

  const cancelado = pedido.estado === "cancelado";
  const idx = ESTADOS_ONLINE.indexOf(pedido.estado as (typeof ESTADOS_ONLINE)[number]);
  const llego = pedido.estado === "ha_llegado";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-6">
      <div>
        <p className="text-sm text-on-bg-muted">Pedido</p>
        <h1 className="font-display text-2xl font-bold tracking-wide text-primary">{pedido.folio}</h1>
        <p className="text-xs text-on-bg-muted">{formatDateTime(pedido.created_at)}</p>
      </div>

      {/* Mapa */}
      {!cancelado && mapboxToken && (
        <MapaSeguimiento
          mapboxToken={mapboxToken}
          estado={pedido.estado}
          direccionEntrega={pedido.direccion_entrega}
          destLat={destLat}
          destLng={destLng}
        />
      )}

      {/* Timeline */}
      <section className="card p-5">
        {cancelado ? (
          <p className="flex items-center gap-2 font-bold text-rose-400">
            <XCircle size={20} /> Pedido cancelado
          </p>
        ) : (
          <ol className="flex flex-col gap-0">
            {ESTADOS_ONLINE.map((e, i) => {
              const done = idx >= i;
              const actual = idx === i;
              const Icon = ICONS[i];
              const evento = pedido.eventos.find((ev) => ev.estado === e);
              return (
                <li key={e} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < ESTADOS_ONLINE.length - 1 && (
                    <span className={`absolute left-[19px] top-10 h-[calc(100%-40px)] w-0.5 rounded ${idx > i ? "bg-primary" : "bg-surface-3"}`} />
                  )}
                  <motion.span
                    animate={actual && !llego ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-white shadow-glow" : "bg-surface-3 text-on-bg-muted"}`}
                  >
                    <Icon size={17} />
                  </motion.span>
                  <div className="pt-1.5">
                    <p className={`text-sm font-bold ${done ? "" : "text-on-bg-muted"}`}>{LABELS[e]}</p>
                    {evento && <p className="text-xs text-on-bg-muted">{formatDateTime(evento.created_at)}</p>}
                    {e === "en_camino" && actual && pedido.repartidor && (
                      <p className="text-xs text-on-bg-muted">Repartidor: <strong>{pedido.repartidor}</strong></p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {llego && (
        <section className="card border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="font-bold text-emerald-500">¡Tu pedido fue entregado! 🎉</p>
          <p className="mt-1 text-sm text-on-bg-muted">
            {pedido.entregado_at && <>Entregado el {formatDateTime(pedido.entregado_at)}. </>}
            {pedido.repartidor && <>Repartidor: {pedido.repartidor}. </>}
            Ganaste <strong className="text-accent">{pedido.puntos_ganados} puntos</strong>.
          </p>
        </section>
      )}

      {llego && !pedido.encuesta && <Encuesta pedidoId={pedido.id} onDone={load} />}
      {llego && pedido.encuesta && (
        <p className="text-center text-sm text-on-bg-muted">Gracias por contestar la encuesta 💛</p>
      )}

      <section className="card p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Resumen</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {pedido.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3">
              <span className="text-on-bg-muted">{Number(it.cantidad)}× {it.producto?.nombre ?? "Producto"}</span>
              <span className="font-semibold">{formatMXN(it.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-hairline pt-3 text-sm">
          <div className="flex justify-between"><span className="text-on-bg-muted">Subtotal</span><span>{formatMXN(pedido.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-on-bg-muted">Entrega</span><span>{formatMXN(pedido.envio)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{formatMXN(pedido.total)}</span></div>
        </div>
        {pedido.direccion_entrega && (
          <p className="mt-3 text-xs text-on-bg-muted">📍 {pedido.direccion_entrega}</p>
        )}
      </section>

      <a href={`tel:${TEL_PEDIDOS}`} className="btn-ghost w-full">
        <Phone size={15} /> Llamar · {TEL_PEDIDOS_DISPLAY}
      </a>
    </div>
  );
}

function Encuesta({ pedidoId, onDone }: { pedidoId: number; onDone: () => void }) {
  const [completo, setCompleto] = useState<boolean | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentarios, setComentarios] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (completo === null || estrellas === 0) { setError("Contesta si llegó completo y tu calificación."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/encuestas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, completo, estrellas, comentarios }),
      });
      if (!res.ok) throw new Error("No se pudo enviar la encuesta");
      onDone();
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };

  return (
    <section className="card flex flex-col gap-4 p-5">
      <h2 className="font-display text-lg font-bold">Cuéntanos cómo nos fue</h2>
      <div>
        <p className="label">¿Tu pedido llegó completo?</p>
        <div className="flex gap-2">
          {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map(({ v, l }) => (
            <button key={l} onClick={() => setCompleto(v)}
              className={`chip px-5 py-2.5 text-sm ${completo === v ? "chip-active" : ""}`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Califica tu experiencia</p>
        <div className="flex gap-1.5">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setEstrellas(n)} className="p-1">
              <Star size={28} className={n <= estrellas ? "fill-accent text-accent" : "text-on-bg-muted/40"} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="coment" className="label">Comentarios (opcional)</label>
        <textarea id="coment" rows={3} className="input min-h-[72px] resize-none"
          placeholder="¿Algo que debamos mejorar?" value={comentarios}
          onChange={(e) => setComentarios(e.target.value)} />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button onClick={enviar} disabled={loading} className="btn-primary w-full py-3">
        {loading && <Loader2 size={16} className="animate-spin" />} Enviar encuesta
      </button>
    </section>
  );
}
