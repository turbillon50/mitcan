"use client";

import { useState, useTransition } from "react";
import { Bike, Check, Loader2 } from "lucide-react";

export default function RepartidorForm({
  pedidoId,
  inicial,
  repartidores,
  action,
}: {
  pedidoId: number;
  inicial: string;
  repartidores: string[];
  action: (id: number, repartidor: string) => Promise<void>;
}) {
  const [valor, setValor] = useState(inicial);
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  const guardar = () =>
    start(async () => {
      await action(pedidoId, valor);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Bike size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-bg-muted" />
        <input
          list={`repartidores-${pedidoId}`}
          className="input pl-9"
          placeholder="Nombre del repartidor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <datalist id={`repartidores-${pedidoId}`}>
          {repartidores.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>
      <button onClick={guardar} disabled={pending} className="btn-primary h-10 px-4 text-sm">
        {pending ? <Loader2 size={14} className="animate-spin" /> : ok ? <Check size={14} /> : null}
        Asignar
      </button>
    </div>
  );
}
