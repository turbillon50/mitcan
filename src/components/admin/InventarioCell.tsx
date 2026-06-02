"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { upsertInventario } from "@/app/admin/actions";

export default function InventarioCell({
  productoId,
  sucursalId,
  stock,
  disponible,
}: {
  productoId: number;
  sucursalId: number;
  stock: number;
  disponible: boolean;
}) {
  const [s, setS] = useState(String(stock));
  const [disp, setDisp] = useState(disponible);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () =>
    start(async () => {
      await upsertInventario(productoId, sucursalId, parseFloat(s) || 0, disp);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        min="0"
        value={s}
        onChange={(e) => {
          setS(e.target.value);
          setDirty(true);
        }}
        className="w-20 rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-primary/50"
      />
      <label className="flex items-center gap-1 text-xs text-on-bg-muted">
        <input
          type="checkbox"
          checked={disp}
          onChange={(e) => {
            setDisp(e.target.checked);
            setDirty(true);
          }}
        />
        Disp.
      </label>
      {dirty ? (
        <button
          onClick={save}
          disabled={pending}
          className="btn-primary px-2.5 py-1 text-xs"
        >
          {pending ? "…" : "Guardar"}
        </button>
      ) : saved ? (
        <span className="text-emerald-400">
          <Check size={16} />
        </span>
      ) : null}
    </div>
  );
}
