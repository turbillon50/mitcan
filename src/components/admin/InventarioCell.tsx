"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { upsertInventario } from "@/app/admin/actions";

export default function InventarioCell({
  productoId,
  sucursalId,
  stock,
  minStock,
  precio,
  precioBase,
}: {
  productoId: number;
  sucursalId: number;
  stock: number;
  minStock: number;
  precio: number | null;
  precioBase: number;
}) {
  const [s, setS] = useState(String(stock));
  const [min, setMin] = useState(String(minStock));
  const [pr, setPr] = useState(precio != null ? String(precio) : "");
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () =>
    start(async () => {
      await upsertInventario(
        productoId,
        sucursalId,
        parseFloat(s) || 0,
        parseFloat(min) || 0,
        pr.trim() === "" ? null : parseFloat(pr)
      );
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });

  const cls =
    "w-20 rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-primary/50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-xs text-on-bg-muted">
        stock
        <input
          type="number"
          step="0.01"
          min="0"
          value={s}
          aria-label="Stock"
          onChange={(e) => { setS(e.target.value); setDirty(true); }}
          className={cls}
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-on-bg-muted">
        mín
        <input
          type="number"
          step="0.01"
          min="0"
          value={min}
          aria-label="Stock mínimo"
          onChange={(e) => { setMin(e.target.value); setDirty(true); }}
          className="w-16 rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-primary/50"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-on-bg-muted">
        precio
        <input
          type="number"
          step="0.01"
          min="0"
          value={pr}
          aria-label="Precio en sucursal"
          placeholder={String(precioBase)}
          onChange={(e) => { setPr(e.target.value); setDirty(true); }}
          className={cls}
        />
      </label>
      {dirty ? (
        <button onClick={save} disabled={pending} className="btn-primary px-2.5 py-1 text-xs">
          {pending ? "…" : "Guardar"}
        </button>
      ) : saved ? (
        <span className="text-emerald-400"><Check size={16} /></span>
      ) : null}
    </div>
  );
}
