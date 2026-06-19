"use client";
import { useState, useTransition } from "react";

type Rep = { id: string; nombre: string };

export default function AsignarRepartidorInline({
  pedidoId, repartidorActualId, repartidorActualNombre, repartidores, action,
}: {
  pedidoId: number;
  repartidorActualId: string | null;
  repartidorActualNombre: string | null;
  repartidores: Rep[];
  action: (repId: string, nombre: string) => Promise<void>;
}) {
  const [sel, setSel] = useState(repartidorActualId ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const guardar = () => start(async () => {
    const rep = repartidores.find(r => r.id === sel);
    await action(sel, rep?.nombre ?? "");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  if (repartidores.length === 0) {
    return <span className="text-xs text-on-bg-muted">Sin repartidores</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={sel}
        onChange={e => { setSel(e.target.value); setSaved(false); }}
        className="input py-1 px-2 text-xs max-w-[130px]"
      >
        <option value="">— Asignar —</option>
        {repartidores.map(r => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
      {sel !== (repartidorActualId ?? "") && (
        <button
          onClick={guardar}
          disabled={pending}
          className="btn-primary px-2.5 py-1 text-xs"
        >
          {pending ? "…" : "OK"}
        </button>
      )}
      {saved && <span className="text-xs text-emerald-500 font-bold">✓</span>}
    </div>
  );
}
