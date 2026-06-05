"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, MapPin, Phone, BadgeDollarSign, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";
import { ENVIO_FIJO } from "@/lib/online-const";

export default function CheckoutClient({
  defaults,
}: {
  defaults: { nombre: string; telefono: string; direccion: string };
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

  if (!ready) {
    return <div className="card h-72 animate-pulse bg-surface-2" />;
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <ShoppingCart size={40} className="text-primary/50" />
        <p className="text-on-bg-muted">No hay productos en tu carrito.</p>
        <Link href="/pedido" className="btn-primary px-6 py-3">Ver categorías</Link>
      </div>
    );
  }

  const total = subtotal + ENVIO_FIJO;

  const confirmar = async () => {
    const errs: typeof fieldErr = {};
    if (!direccion.trim() || direccion.trim().length < 10)
      errs.direccion = "Escribe tu dirección completa (calle, número, colonia).";
    if (!/^\d{10}$/.test(telefono.replace(/\D/g, "")))
      errs.telefono = "Teléfono a 10 dígitos.";
    setFieldErr(errs);
    if (Object.keys(errs).length || !acepta) {
      if (!acepta) setError("Confirma que aceptas el total del pedido.");
      return;
    }
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el pedido");
      clear();
      router.push(`/pedido/confirmado/${data.folio}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_380px]">
      <section className="flex flex-col gap-5">
        <h1 className="section-title text-2xl">Confirma tu pedido</h1>

        <div className="card flex flex-col gap-4 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <MapPin size={18} className="text-primary" /> Entrega
          </h2>
          <div>
            <label htmlFor="direccion" className="label">Dirección de entrega *</label>
            <textarea
              id="direccion"
              rows={3}
              className={`input min-h-[88px] resize-none ${fieldErr.direccion ? "border-rose-500/60 ring-1 ring-rose-500/30" : ""}`}
              placeholder="Calle, número, colonia, referencias…"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            {fieldErr.direccion && <p className="mt-1 text-xs text-rose-400">{fieldErr.direccion}</p>}
          </div>
          <div>
            <label htmlFor="telefono" className="label">Teléfono de contacto *</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-bg-muted" />
              <input
                id="telefono"
                type="tel"
                inputMode="numeric"
                className={`input pl-10 ${fieldErr.telefono ? "border-rose-500/60 ring-1 ring-rose-500/30" : ""}`}
                placeholder="311 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            {fieldErr.telefono && <p className="mt-1 text-xs text-rose-400">{fieldErr.telefono}</p>}
          </div>
          <div>
            <label htmlFor="notas" className="label">Notas para el repartidor (opcional)</label>
            <input
              id="notas"
              className="input"
              placeholder="Ej. tocar el timbre, casa portón negro…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </div>

        <div className="card flex items-center gap-3 p-5">
          <BadgeDollarSign size={22} className="shrink-0 text-primary" />
          <div>
            <p className="font-bold">Pago contra entrega</p>
            <p className="text-sm text-on-bg-muted">
              Pagas en efectivo al recibir tu pedido. Pronto: tarjeta, transferencia y SPEI.
            </p>
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">Tu pedido</h2>
          <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto text-sm">
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
            <span className="text-on-bg-muted">Costo de entrega</span>
            <span className="font-semibold">{formatMXN(ENVIO_FIJO)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold">Total a pagar</span>
            <span className="font-extrabold text-primary">{formatMXN(total)}</span>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3 text-sm">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => { setAcepta(e.target.checked); if (e.target.checked) setError(null); }}
              className="mt-0.5 h-4 w-4 accent-[#C41E3A]"
            />
            <span>
              Acepto el total de <strong>{formatMXN(total)}</strong> (incluye ${ENVIO_FIJO} de
              entrega) y pagaré contra entrega.
            </span>
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
            {loading && <Loader2 size={17} className="animate-spin" />}
            {loading ? "Creando pedido…" : "Confirmar pedido"}
          </motion.button>
          <Link href="/pedido/carrito" className="btn-ghost w-full">Volver al carrito</Link>
        </div>
      </aside>
    </div>
  );
}
