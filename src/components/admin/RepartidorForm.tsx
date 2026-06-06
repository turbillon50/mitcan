"use client";

import { useState, useTransition } from "react";
import { Bike, Check, Loader2 } from "lucide-react";

type Repartidor = { id: string; nombre: string };

export default function RepartidorForm({
  pedidoId,
  inicialId,
  repartidores,
  action,
}: {
  pedidoId: number;
  inicialId: string;
  repartidores: Repartidor[];
  action: (id: number, repartidorId: string, nombre: string) => Promise<void>;
}) {
  const [valor, setValor] = useState(inicialId);
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  const guardar = () =>
    start(async () => {
      const nombre = repartidores.find((r) => r.id === valor)?.nombre ?? "";
      await action(pedidoId, valor, nombre);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Bike size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-bg-muted" />
        <select
          className="input pl-9"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-label="Repartidor en moto"
        >
          <option value="">— Sin asignar —</option>
          {repartidores.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>
      <button onClick={guardar} disabled={pending} className="btn-primary h-10 px-4 text-sm">
        {pending ? <Loader2 size={14} className="animate-spin" /> : ok ? <Check size={14} /> : null}
        Asignar
      </button>
      {repartidores.length === 0 && (
        <p className="w-full text-xs text-on-bg-muted">
          No hay repartidores. Crea usuarios con rol <strong>Repartidor</strong> en{" "}
          <span className="text-primary">Usuarios</span>.
        </p>
      )}
    </div>
  );
}
