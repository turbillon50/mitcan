"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [geoStatus, setGeoStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [cobertura, setCobertura] = useState<CoberturaResult | null>(null);
  const [cobLoading, setCobLoading] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<unknown>(null);

  // Geolocalización al cargar
  useEffect(() => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setGeoStatus("ok"); },
      () => setGeoStatus("error"),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const verificarCobertura = useCallback(async (lat: number, lng: number) => {
    setCobLoading(true);
    try {
      const res = await fetch(`/api/cobertura?lat=${lat}&lng=${lng}`);
      const data: CoberturaResult = await res.json();
      setCobertura(data);
    } catch { setCobertura(null); }
    finally { setCobLoading(false); }
  }, []);

  useEffect(() => {
    if (userLat != null && userLng != null) verificarCobertura(userLat, userLng);
  }, [userLat, userLng, verificarCobertura]);

  // Mapa
  useEffect(() => {
    if (!mapboxToken || !mapRef.current || !cobertura?.sucursal || userLat == null || userLng == null) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapRef.current) return;
      (mapboxgl as unknown as { accessToken: string }).accessToken = mapboxToken;
      const suc = cobertura.sucursal!;
      const cLat = (suc.lat + userLat) / 2;
      const cLng = (suc.lng + userLng) / 2;
      const dist = cobertura.distancia_km ?? 0;
      const zoom = dist < 3 ? 13 : dist < 15 ? 11 : dist < 60 ? 9 : 7;

      type MBMap = { flyTo: (o: unknown) => void; resize: () => void };
      type MBMapCtor = new (o: unknown) => MBMap;
      type MBMarkerCtor = new (el: HTMLElement) => { setLngLat: (c: [number, number]) => { addTo: (m: unknown) => void } };

      if (!mapInst.current) {
        const MapCtor = (mapboxgl as unknown as { Map: MBMapCtor }).Map;
        const map = new MapCtor({ container: mapRef.current!, style: "mapbox://styles/mapbox/dark-v11", center: [cLng, cLat], zoom });
        mapInst.current = map;
        setTimeout(() => map.resize(), 200);

        const MarkerCtor = (mapboxgl as unknown as { Marker: MBMarkerCtor }).Marker;

        const elS = document.createElement("div");
        elS.style.cssText = "width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.3)";
        new MarkerCtor(elS).setLngLat([suc.lng, suc.lat]).addTo(map);

        const elC = document.createElement("div");
        elC.style.cssText = "width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 0 5px rgba(239,68,68,.3)";
        new MarkerCtor(elC).setLngLat([userLng, userLat]).addTo(map);
      }
    })();
    return () => { cancelled = true; };
  }, [cobertura, userLat, userLng, mapboxToken]);

  const confirmar = async () => {
    const errs: typeof fieldErr = {};
    if (!direccion.trim() || direccion.trim().length < 10)
      errs.direccion = "Escribe tu dirección completa (calle, número, colonia).";
    if (!/^\d{10}$/.test(telefono.replace(/\D/g, "")))
      errs.telefono = "Teléfono a 10 dígitos.";
    setFieldErr(errs);
    if (Object.keys(errs).length) return;
    if (!acepta) { setError("Confirma que aceptas el total del pedido."); return; }
    if (cobertura && !cobertura.cobertura) { setError("Tu dirección está fuera del rango de entrega."); return; }

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
          sucursal_id: cobertura?.sucursal?.id ?? null,
        }),
      });

      // Fix anti-JSON-parse-error: verificar content-type antes de parsear
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("El servidor no respondió correctamente. Intenta de nuevo.");
      }
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
  const fueraDeRango = cobertura != null && !cobertura.cobertura;

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_380px]">
      <section className="flex flex-col gap-5">
        <h1 className="section-title text-2xl">Confirma tu pedido</h1>

        {/* Estado de cobertura */}
        {geoStatus === "loading" && (
          <div className="rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-sm text-on-bg-muted animate-pulse">
            Detectando tu ubicación…
          </div>
        )}
        {geoStatus === "error" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Activa tu ubicación para verificar cobertura automáticamente.
          </div>
        )}
        {cobLoading && (
          <div className="rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-sm text-on-bg-muted animate-pulse">
            Verificando cobertura en tu zona…
          </div>
        )}
        {cobertura && !cobLoading && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            cobertura.cobertura
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}>
            {cobertura.mensaje}
          </div>
        )}

        {/* Mapa sucursal ↔ cliente */}
        {cobertura?.sucursal && userLat != null && userLng != null && (
          <div className="overflow-hidden rounded-2xl border border-hairline">
            <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-4 py-2.5 text-xs">
              <span>
                <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-blue-500 align-middle" />
                Sucursal: <strong>{cobertura.sucursal.nombre}</strong>
              </span>
              <span>
                <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-red-500 align-middle" />
                Tu ubicación
              </span>
            </div>
            <div ref={mapRef} style={{ height: "220px", width: "100%" }} />
            <div className="border-t border-hairline bg-surface-2 px-4 py-2 text-xs text-on-bg-muted">
              Distancia: {cobertura.distancia_km} km · Radio de entrega: {cobertura.sucursal.radio_km} km
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-display text-lg font-bold">Dirección de entrega</h2>
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
            <label htmlFor="tel" className="label">Teléfono *</label>
            <input id="tel" type="tel" inputMode="numeric"
              className={`input ${fieldErr.telefono ? "border-rose-500/60" : ""}`}
              placeholder="311 000 0000"
              value={telefono} onChange={(e) => setTelefono(e.target.value)}
            />
            {fieldErr.telefono && <p className="mt-1 text-xs text-rose-400">{fieldErr.telefono}</p>}
          </div>
          <div>
            <label htmlFor="notas" className="label">Notas para el repartidor (opcional)</label>
            <input id="notas" className="input" placeholder="Tocar timbre, portón negro…"
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
                <span className="text-on-bg-muted">{it.cantidad}× {it.nombre}</span>
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

          {fueraDeRango && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
              Tu ubicación está fuera de nuestro rango de entrega actual. Por el momento no podemos llevar tu pedido a domicilio.
            </div>
          )}
          {error && !fueraDeRango && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
              {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading || fueraDeRango}
            onClick={confirmar}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
          >
            {loading ? "Creando pedido…" : fueraDeRango ? "Sin cobertura en tu zona" : "Confirmar pedido"}
          </motion.button>
          <Link href="/pedido/carrito" className="btn-ghost w-full">Volver al carrito</Link>
        </div>
      </aside>
    </div>
  );
}
