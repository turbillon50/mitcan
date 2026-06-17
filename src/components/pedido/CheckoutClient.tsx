"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";
import { ENVIO_FIJO } from "@/lib/online-const";

type SucursalInfo = {
  id: number; nombre: string; lat: number; lng: number;
  direccion: string | null; telefono: string | null; radio_km: number;
};
type CoberturaResult = {
  cobertura: boolean; distancia_km?: number;
  sucursal?: SucursalInfo | null; mensaje: string;
};

function MapaCheckout({
  mapboxToken, sucursal, userLat, userLng,
}: {
  mapboxToken: string;
  sucursal: SucursalInfo;
  userLat: number | null;
  userLng: number | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Esperar a que el DOM esté listo antes de inicializar Mapbox
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted || !mapboxToken || !mapRef.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;
      (mapboxgl as unknown as { accessToken: string }).accessToken = mapboxToken;

      type MBMap = { resize: () => void; fitBounds: (b: unknown, o: unknown) => void };
      type MBMapCtor = new (o: unknown) => MBMap;
      type MBMarkerCtor = new (el: HTMLElement) => { setLngLat: (c: [number, number]) => { addTo: (m: unknown) => void } };
      type LngLatBoundsCtor = new () => { extend: (c: [number, number]) => void };

      const MapCtor = (mapboxgl as unknown as { Map: MBMapCtor }).Map;
      const map = new MapCtor({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [sucursal.lng, sucursal.lat],
        zoom: 13,
        attributionControl: false,
      });

      const MarkerCtor = (mapboxgl as unknown as { Marker: MBMarkerCtor }).Marker;
      const BoundsCtor = (mapboxgl as unknown as { LngLatBounds: LngLatBoundsCtor }).LngLatBounds;

      // Marcador sucursal — azul
      const elS = document.createElement("div");
      elS.style.cssText = "width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.25);flex-shrink:0";
      new MarkerCtor(elS).setLngLat([sucursal.lng, sucursal.lat]).addTo(map);

      // Marcador cliente — rojo (solo si hay GPS)
      if (userLat != null && userLng != null) {
        const elC = document.createElement("div");
        elC.style.cssText = "width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 0 5px rgba(239,68,68,.25);flex-shrink:0";
        new MarkerCtor(elC).setLngLat([userLng, userLat]).addTo(map);

        // Ajustar para mostrar ambos puntos
        const bounds = new BoundsCtor();
        bounds.extend([sucursal.lng, sucursal.lat]);
        bounds.extend([userLng, userLat]);
        map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 0 });
      }

      // Resize después de montar para asegurar que el mapa llena el contenedor
      setTimeout(() => (map as MBMap).resize(), 100);
      setTimeout(() => (map as MBMap).resize(), 500);
    })();
    return () => { cancelled = true; };
  }, [mounted, mapboxToken, sucursal, userLat, userLng]);

  return (
    <div
      ref={mapRef}
      style={{
        height: "200px",
        width: "100%",
        display: "block",
        position: "relative",
        minHeight: "200px",
      }}
    />
  );
}

export default function CheckoutClient({
  defaults, mapboxToken,
}: {
  defaults: { nombre: string; telefono: string; direccion: string };
  mapboxToken: string;
}) {
  const { items, ready, subtotal, clear } = useCart();
  const router = useRouter();

  const [direccion, setDireccion] = useState(defaults.direccion);
  const [telefono, setTelefono] = useState(defaults.telefono);
  const [notas, setNotas] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ direccion?: string; telefono?: string }>({});

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [sucursal, setSucursal] = useState<SucursalInfo | null>(null);

  // GPS silencioso — solo para el mapa
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => {},
      { timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  // Cargar sucursal abierta más cercana
  useEffect(() => {
    const lat = userLat ?? 21.5;
    const lng = userLng ?? -104.9;
    fetch(`/api/cobertura?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then((d: CoberturaResult) => { if (d.sucursal) setSucursal(d.sucursal); })
      .catch(() => null);
  }, [userLat, userLng]);

  const confirmar = async () => {
    const errs: typeof fieldErr = {};
    if (!direccion.trim() || direccion.trim().length < 10)
      errs.direccion = "Escribe tu dirección completa (calle, número, colonia).";
    if (!/^\d{10}$/.test(telefono.replace(/\D/g, "")))
      errs.telefono = "Teléfono a 10 dígitos.";
    setFieldErr(errs);
    if (Object.keys(errs).length) return;
    if (!acepta) { setError("Confirma que aceptas el total del pedido."); return; }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "en_linea",
          items: items.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })),
          direccion_entrega: direccion.trim(),
          telefono_entrega: telefono.trim(),
          notas: notas.trim() || undefined,
          acepta_total: true,
          sucursal_id: sucursal?.id ?? null,
        }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Error del servidor. Intenta de nuevo.");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear el pedido");
      clear();
      router.push(`/pedido/confirmado/${data.folio}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  if (!ready) return <div className="card h-72 animate-pulse bg-surface-2" />;

  if (items.length === 0) return (
    <div className="card flex flex-col items-center gap-4 p-12 text-center">
      <p className="text-on-bg-muted">No hay productos en tu carrito.</p>
      <Link href="/pedido" className="btn-primary px-6 py-3">Ver categorías</Link>
    </div>
  );

  const total = subtotal + ENVIO_FIJO;

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_380px]">
      <section className="flex min-w-0 flex-col gap-5">
        <h1 className="section-title text-2xl">Confirma tu pedido</h1>

        {/* Mapa sucursal */}
        {sucursal && mapboxToken && (
          <div className="overflow-hidden rounded-2xl border border-hairline">
            <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <strong>{sucursal.nombre}</strong>
              </span>
              {userLat != null && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  Tu ubicación
                </span>
              )}
            </div>
            <MapaCheckout
              mapboxToken={mapboxToken}
              sucursal={sucursal}
              userLat={userLat}
              userLng={userLng}
            />
            <div className="border-t border-hairline bg-surface-2 px-4 py-2 text-xs text-on-bg-muted">
              Esta sucursal atenderá tu pedido · Tel: {sucursal.telefono}
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-display text-lg font-bold">Dirección de entrega</h2>
          <p className="text-xs text-on-bg-muted -mt-2">
            Escribe la dirección donde quieres recibir tu pedido. Puede ser diferente a donde te encuentras ahora.
          </p>
          <div>
            <label htmlFor="dir" className="label">Dirección completa *</label>
            <textarea id="dir" rows={3}
              className={`input min-h-[88px] resize-none ${fieldErr.direccion ? "border-rose-500/60" : ""}`}
              placeholder="Calle, número, colonia, referencias…"
              value={direccion} onChange={(e) => setDireccion(e.target.value)}
            />
            {fieldErr.direccion && <p className="mt-1 text-xs text-rose-400">{fieldErr.direccion}</p>}
          </div>
          <div>
            <label htmlFor="tel" className="label">Teléfono de contacto *</label>
            <input id="tel" type="tel" inputMode="numeric"
              className={`input ${fieldErr.telefono ? "border-rose-500/60" : ""}`}
              placeholder="311 000 0000"
              value={telefono} onChange={(e) => setTelefono(e.target.value)}
            />
            {fieldErr.telefono && <p className="mt-1 text-xs text-rose-400">{fieldErr.telefono}</p>}
          </div>
          <div>
            <label htmlFor="notas" className="label">Notas para el repartidor (opcional)</label>
            <input id="notas" className="input"
              placeholder="Tocar timbre, portón negro…"
              value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        <div className="card flex items-center gap-3 p-4">
          <div>
            <p className="font-bold">Pago contra entrega</p>
            <p className="text-sm text-on-bg-muted">Pagas en efectivo al recibir tu pedido.</p>
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">Tu pedido</h2>
          <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto text-sm">
            {items.map((it) => (
              <li key={it.producto_id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-on-bg-muted">{it.cantidad}× {it.nombre}</span>
                <span className="shrink-0 font-semibold">{formatMXN(it.precio * it.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-hairline pt-3 text-sm">
            <span className="text-on-bg-muted">Subtotal</span>
            <span className="font-semibold">{formatMXN(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-bg-muted">Entrega</span>
            <span className="font-semibold">{formatMXN(ENVIO_FIJO)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-primary">{formatMXN(total)}</span>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3 text-sm">
            <input type="checkbox" checked={acepta}
              onChange={(e) => { setAcepta(e.target.checked); if (e.target.checked) setError(null); }}
              className="mt-0.5 h-4 w-4 accent-[#C41E3A]"
            />
            <span>Acepto <strong>{formatMXN(total)}</strong> (incluye ${ENVIO_FIJO} de entrega) y pagaré contra entrega.</span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
              {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={confirmar}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
          >
            {loading ? "Creando pedido…" : "Confirmar pedido"}
          </motion.button>
          <Link href="/pedido/carrito" className="btn-ghost w-full">Volver al carrito</Link>
        </div>
      </aside>
    </div>
  );
}
