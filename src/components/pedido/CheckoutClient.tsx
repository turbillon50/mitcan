"use client";
import MapaCheckoutOSM from "@/components/MapaCheckoutOSM";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";
import { ENVIO_FIJO } from "@/lib/online-const";
import { useT } from "@/components/I18nProvider";

type SucursalInfo = {
  id: number; nombre: string; lat: number; lng: number;
  direccion: string | null; telefono: string | null; radio_km: number;
};
type CoberturaResult = {
  cobertura: boolean; distancia_km?: number;
  sucursal?: SucursalInfo | null; mensaje: string;
};

export default function CheckoutClient({
  defaults, mapboxToken: _t,
}: {
  defaults: { nombre: string; telefono: string; direccion: string };
  mapboxToken: string;
}) {
  const { items, ready, subtotal, clear } = useCart();
  const router = useRouter();
  const t = useT();

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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserLat(p.coords.latitude); setUserLng(p.coords.longitude); },
      () => {},
      { timeout: 8000, maximumAge: 120000 }
    );
  }, []);

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
      errs.direccion = t("checkout.errAddress");
    if (!/^[0-9]{10}$/.test(telefono.replace(/[^0-9]/g, "")))
      errs.telefono = t("checkout.errPhone");
    setFieldErr(errs);
    if (Object.keys(errs).length) return;
    if (!acepta) { setError(t("checkout.errAccept")); return; }
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
      if (!ct.includes("application/json")) throw new Error(t("checkout.errorOrder"));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t("checkout.errorOrder"));
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
      <p className="text-on-bg-muted">{t("cart.empty")}</p>
      <Link href="/pedido" className="btn-primary px-6 py-3">{t("cart.seeProducts")}</Link>
    </div>
  );

  const total = subtotal + ENVIO_FIJO;

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_380px]">
      <section className="flex min-w-0 flex-col gap-5">
        <h1 className="section-title text-2xl">{t("checkout.title")}</h1>

        {sucursal && (
          <div className="overflow-hidden rounded-2xl border border-hairline">
            <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <strong>{sucursal.nombre}</strong>
              </span>
              {userLat != null && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  {t("checkout.yourLocation")}
                </span>
              )}
            </div>
            <MapaCheckoutOSM
              sucLat={sucursal.lat}
              sucLng={sucursal.lng}
              userLat={userLat}
              userLng={userLng}
            />
            <div className="border-t border-hairline bg-surface-2 px-4 py-2 text-xs text-on-bg-muted">
              {t("checkout.branchWillServe")} · Tel: {sucursal.telefono}
            </div>
          </div>
        )}

        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-display text-lg font-bold">{t("checkout.address")}</h2>
          <p className="text-xs text-on-bg-muted -mt-2">{t("checkout.addressHint")}</p>
          <div>
            <label htmlFor="dir" className="label">{t("checkout.address")} *</label>
            <textarea id="dir" rows={3}
              className={`input min-h-[88px] resize-none ${fieldErr.direccion ? "border-rose-500/60" : ""}`}
              placeholder={t("checkout.addressPlaceholder")}
              value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            {fieldErr.direccion && <p className="mt-1 text-xs text-rose-400">{fieldErr.direccion}</p>}
          </div>
          <div>
            <label htmlFor="tel" className="label">{t("checkout.phone")} *</label>
            <input id="tel" type="tel" inputMode="numeric"
              className={`input ${fieldErr.telefono ? "border-rose-500/60" : ""}`}
              placeholder="311 000 0000"
              value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            {fieldErr.telefono && <p className="mt-1 text-xs text-rose-400">{fieldErr.telefono}</p>}
          </div>
          <div>
            <label htmlFor="notas" className="label">{t("checkout.references")}</label>
            <input id="notas" className="input" placeholder={t("checkout.notesPlaceholder")}
              value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        <div className="card p-4">
          <p className="font-bold">{t("checkout.cash")}</p>
          <p className="text-sm text-on-bg-muted">{t("checkout.cashHint")}</p>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">{t("checkout.yourOrder")}</h2>
          <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto text-sm">
            {items.map((it) => (
              <li key={it.producto_id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-on-bg-muted">{it.cantidad}× {it.nombre}</span>
                <span className="shrink-0 font-semibold">{formatMXN(it.precio * it.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-hairline pt-3 text-sm">
            <span className="text-on-bg-muted">{t("cart.subtotal")}</span>
            <span className="font-semibold">{formatMXN(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-bg-muted">{t("cart.delivery")}</span>
            <span className="font-semibold">{formatMXN(ENVIO_FIJO)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold">{t("cart.total")}</span>
            <span className="font-extrabold text-primary">{formatMXN(total)}</span>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3 text-sm">
            <input type="checkbox" checked={acepta}
              onChange={(e) => { setAcepta(e.target.checked); if (e.target.checked) setError(null); }}
              className="mt-0.5 h-4 w-4 accent-[#C41E3A]" />
            <span>{t("checkout.acceptPre")} <strong>{formatMXN(total)}</strong> {t("checkout.acceptPost")}</span>
          </label>
          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>
          )}
          <motion.button whileTap={{ scale: 0.98 }} disabled={loading} onClick={confirmar}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-60">
            {loading ? t("checkout.placing") : t("checkout.placeOrder")}
          </motion.button>
          <Link href="/pedido/carrito" className="btn-ghost w-full">{t("checkout.backToCart")}</Link>
        </div>
      </aside>
    </div>
  );
}
