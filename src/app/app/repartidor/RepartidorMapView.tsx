// @ts-nocheck
"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { repartidorAvanzar } from "./actions";
import { formatMXN } from "@/lib/format";

type Pedido = {
  id: number; folio: string; estado: string; total: number;
  direccion_entrega: string | null; telefono_entrega: string | null;
  cliente: string | null; notas: string | null; orden: number;
  items: { id: number; cantidad: number; nombre: string }[];
};

const ESTADO_LABEL: Record<string,string> = {
  asignado: "Asignado",
  entregado_repartidor: "Listo para salir",
  en_camino: "En camino",
  ha_llegado: "Entregado",
};

const ESTADO_COLOR: Record<string,string> = {
  asignado: "bg-amber-500/10 text-amber-400",
  entregado_repartidor: "bg-blue-500/10 text-blue-400",
  en_camino: "bg-primary/10 text-primary",
  ha_llegado: "bg-emerald-500/10 text-emerald-400",
};

export default function RepartidorMapView({
  pedidos: initialPedidos, entregadosHoy, nombre, mapboxToken
}: { pedidos: Pedido[]; entregadosHoy: number; nombre: string; mapboxToken: string }) {
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [sel, setSel] = useState<Pedido | null>(pedidos[0] ?? null);
  const [estados, setEstados] = useState<Record<number,string>>(
    Object.fromEntries(pedidos.map(p => [p.id, p.estado]))
  );
  const [errors, setErrors] = useState<Record<number,string>>({});
  const [pending, start] = useTransition();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  // Inicializar mapa Leaflet/OpenStreetMap (sin token)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current, {
        center: [21.5, -104.89],
        zoom: 11,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 300);
    })();
    return () => {
      cancelled = true;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  const avanzar = (pedidoId: number, next: "en_camino" | "ha_llegado") =>
    start(async () => {
      try {
        await repartidorAvanzar(pedidoId, next);
        setEstados(prev => ({ ...prev, [pedidoId]: next }));
        if (next === "ha_llegado") {
          setPedidos(prev => prev.filter(p => p.id !== pedidoId));
          setSel(prev => prev?.id === pedidoId ? null : prev);
        }
      } catch (e) {
        setErrors(prev => ({ ...prev, [pedidoId]: (e as Error).message }));
      }
    });

  const abrirRuta = (p: Pedido) => {
    const q = p.direccion_entrega
      ? encodeURIComponent(p.direccion_entrega + " Tepic Nayarit Mexico")
      : "";
    if (!q) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`, "_blank");
  };

  const activas = pedidos.filter(p => estados[p.id] !== "ha_llegado");

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col gap-0 lg:flex-row">

      {/* Lista izquierda */}
      <aside className="flex w-full flex-col overflow-y-auto border-r border-hairline lg:w-[340px] lg:shrink-0">
        <div className="sticky top-0 z-10 border-b border-hairline bg-surface/90 px-4 py-4 backdrop-blur">
          <p className="text-xs text-on-bg-muted">Hola, {nombre}</p>
          <h1 className="section-title text-xl">Mis entregas</h1>
          <p className="text-sm text-on-bg-muted">
            {activas.length} activas · {entregadosHoy} entregadas hoy
          </p>
        </div>

        {activas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="text-2xl">🎉</p>
            <p className="font-bold">Sin entregas pendientes</p>
            <p className="text-sm text-on-bg-muted">{entregadosHoy} entregadas hoy. ¡Excelente jornada!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 divide-y divide-hairline">
            {activas.map((p, i) => {
              const estado = estados[p.id] ?? p.estado;
              const isSel = sel?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSel(p)}
                  className={`cursor-pointer p-4 transition-colors ${
                    isSel ? "bg-primary/5" : "hover:bg-surface-2"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-primary">{p.folio}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLOR[estado] ?? ""}` }>
                      {ESTADO_LABEL[estado] ?? estado}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{p.cliente ?? "Cliente"}</p>
                  {p.direccion_entrega && (
                    <p className="mt-1 text-xs text-on-bg-muted line-clamp-2">{p.direccion_entrega}</p>
                  )}
                  <p className="mt-1 text-sm font-bold">{formatMXN(p.total)} · contra entrega</p>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Panel derecho: mapa + detalle */}
      <main className="flex flex-1 flex-col">
        {/* Mapa */}
        <div ref={mapRef} className="h-48 w-full border-b border-hairline lg:h-56" />

        {/* Detalle del pedido seleccionado */}
        {sel && estados[sel.id] !== "ha_llegado" ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-primary">{sel.folio}</p>
                <p className="font-medium">{sel.cliente}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ESTADO_COLOR[estados[sel.id] ?? sel.estado] ?? ""}` }>
                {ESTADO_LABEL[estados[sel.id] ?? sel.estado] ?? estados[sel.id]}
              </span>
            </div>

            {sel.direccion_entrega && (
              <div className="rounded-xl border border-hairline bg-surface-2 p-4">
                <p className="mb-1 text-xs font-semibold text-on-bg-muted">DIRECCIÓN</p>
                <p className="text-sm">{sel.direccion_entrega}</p>
                {sel.notas && <p className="mt-1 text-xs text-amber-400">Nota: {sel.notas}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {sel.telefono_entrega && (
                <a href={`tel:${sel.telefono_entrega}`} className="btn-ghost py-3 text-sm">
                  📞 Llamar
                </a>
              )}
              <button onClick={() => abrirRuta(sel)} className="btn-ghost py-3 text-sm">
                🗺 Ver ruta
              </button>
            </div>

            <div className="rounded-xl border border-hairline p-4">
              <p className="mb-2 text-xs font-semibold text-on-bg-muted">PRODUCTOS</p>
              {sel.items.map(it => (
                <p key={it.id} className="text-sm text-on-bg-muted">{it.cantidad}× {it.nombre}</p>
              ))}
              <p className="mt-2 font-bold">{formatMXN(sel.total)}</p>
            </div>

            {errors[sel.id] && (
              <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-400">{errors[sel.id]}</p>
            )}

            <div className="flex gap-2">
              {(estados[sel.id] ?? sel.estado) !== "en_camino" && (
                <button
                  onClick={() => avanzar(sel.id, "en_camino")}
                  disabled={pending}
                  className="btn-ghost flex-1 py-3.5 text-sm"
                >
                  {pending ? "..." : "🛵 Salí en camino"}
                </button>
              )}
              <button
                onClick={() => avanzar(sel.id, "ha_llegado")}
                disabled={pending}
                className="btn-primary flex-1 py-3.5 text-sm"
              >
                {pending ? "..." : "✓ Entregado"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-on-bg-muted">
            <p className="text-sm">{activas.length > 0 ? "Selecciona una entrega" : "Sin entregas activas"}</p>
          </div>
        )}
      </main>
    </div>
  );
}
