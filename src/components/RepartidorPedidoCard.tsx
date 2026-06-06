"use client";

import { useState, useTransition } from "react";
import { MapPin, Phone, Navigation, Bike, CheckCircle2, Loader2, Package } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { repartidorAvanzar } from "@/app/app/repartidor/actions";

export type RiderPedido = {
  id: number;
  folio: string;
  estado: string;
  total: number;
  direccion_entrega: string | null;
  telefono_entrega: string | null;
  cliente: string | null;
  lat: number | null;
  lng: number | null;
  items: { id: number; cantidad: number; nombre: string }[];
};

const ESTADO_LABEL: Record<string, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  entregado_repartidor: "Listo para salir",
  asignado: "Asignado",
  en_camino: "En camino",
  ha_llegado: "Entregado",
};

export default function RepartidorPedidoCard({ pedido }: { pedido: RiderPedido }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const avanzar = (next: "en_camino" | "ha_llegado") =>
    start(async () => {
      setError(null);
      try {
        await repartidorAvanzar(pedido.id, next);
        setEstado(next);
      } catch (e) {
        setError((e as Error).message);
      }
    });

  const entregado = estado === "ha_llegado";
  const enCamino = estado === "en_camino";

  const mapsHref =
    pedido.lat != null && pedido.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${pedido.lat},${pedido.lng}`
      : pedido.direccion_entrega
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion_entrega)}`
        : null;

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold tracking-wide text-primary">{pedido.folio}</p>
          <p className="text-sm font-medium">{pedido.cliente ?? "Cliente"}</p>
        </div>
        <span
          className={`chip text-xs ${entregado ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "chip-active"}`}
        >
          {ESTADO_LABEL[estado] ?? estado}
        </span>
      </div>

      {pedido.direccion_entrega && (
        <p className="flex items-start gap-2 text-sm text-on-bg-muted">
          <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
          {pedido.direccion_entrega}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-on-bg-muted">
        <span className="flex items-center gap-1">
          <Package size={14} /> {pedido.items.length} artículos
        </span>
        <span className="font-semibold text-on-bg">{formatMXN(pedido.total)} · contra entrega</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {pedido.telefono_entrega && (
          <a href={`tel:${pedido.telefono_entrega}`} className="btn-ghost py-2.5 text-sm">
            <Phone size={15} /> Llamar
          </a>
        )}
        {mapsHref && (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn-ghost py-2.5 text-sm">
            <Navigation size={15} /> Ir
          </a>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {!entregado && (
        <div className="flex gap-2">
          {!enCamino && (
            <button
              onClick={() => avanzar("en_camino")}
              disabled={pending}
              className="btn-ghost flex-1 py-3 text-sm"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Bike size={16} />}
              Salí en camino
            </button>
          )}
          <button
            onClick={() => avanzar("ha_llegado")}
            disabled={pending}
            className="btn-primary flex-1 py-3 text-sm"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Entregado
          </button>
        </div>
      )}

      {entregado && (
        <p className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-500">
          <CheckCircle2 size={16} /> Entrega confirmada
        </p>
      )}
    </article>
  );
}
