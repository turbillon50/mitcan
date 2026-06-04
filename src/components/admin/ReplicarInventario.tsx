"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Check } from "lucide-react";
import { replicarInventario } from "@/app/admin/actions";

/** Opt-in: copy this branch's stock as a baseline to all other branches. */
export default function ReplicarInventario({
  sucursalId,
  sucursalNombre,
}: {
  sucursalId: number;
  sucursalNombre: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function run() {
    const ok = window.confirm(
      `Copiar el stock de "${sucursalNombre}" como base inicial a TODAS las demás sucursales.\n\n` +
        `Solo llena las que aún no tienen ese producto (no sobreescribe lo que ya capturaste). ` +
        `Lo podrás ajustar después. ¿Continuar?`
    );
    if (!ok) return;
    start(async () => {
      const res = await replicarInventario(sucursalId, true);
      setDone(res.ok ? `Listo: ${res.copiados} registros en ${res.sucursales ?? 0} sucursales` : "Sin datos para copiar");
      setTimeout(() => setDone(null), 4000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={run} disabled={pending} className="btn-ghost text-sm">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
        {pending ? "Copiando…" : "Replicar a todas"}
      </button>
      {done && (
        <span className="flex items-center gap-1 text-xs text-emerald-500">
          <Check size={14} /> {done}
        </span>
      )}
    </div>
  );
}
