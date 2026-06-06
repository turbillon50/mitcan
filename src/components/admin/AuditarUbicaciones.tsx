"use client";

import { useState, useTransition } from "react";
import { MapPinned, Loader2, Check } from "lucide-react";

type Resultado = {
  ok: boolean;
  total: number;
  corregidas: { id: number; nombre: string; antes: string; ahora: string }[];
  sinResolver: { id: number; nombre: string }[];
};

export default function AuditarUbicaciones({
  action,
}: {
  action: () => Promise<Resultado>;
}) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Resultado | null>(null);

  const run = () =>
    start(async () => {
      setRes(await action());
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={run} disabled={pending} className="btn-ghost" type="button">
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MapPinned size={16} />
        )}
        Auditar ubicaciones
      </button>
      {res && (
        <div className="card w-full max-w-md p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-500">
            <Check size={14} /> {res.total} sucursales revisadas ·{" "}
            {res.corregidas.length} corregidas
          </p>
          {res.corregidas.map((c) => (
            <p key={c.id} className="mt-1 text-on-bg-muted">
              <strong>{c.nombre}</strong>: {c.antes} → {c.ahora}
            </p>
          ))}
          {res.sinResolver.length > 0 && (
            <p className="mt-1 text-rose-400">
              Sin resolver (captura manual con el mapa):{" "}
              {res.sinResolver.map((s) => s.nombre).join(", ")}
            </p>
          )}
          {res.corregidas.length === 0 && res.sinResolver.length === 0 && (
            <p className="mt-1 text-on-bg-muted">
              Todas las sucursales están dentro del área de servicio. ✅
            </p>
          )}
        </div>
      )}
    </div>
  );
}
