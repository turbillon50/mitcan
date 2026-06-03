"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, Check } from "lucide-react";
import { savePreciosBatch } from "@/app/admin/actions";

type Prod = { id: number; nombre: string; base: number; unidad: string };
type Suc = { id: number; nombre: string };

export default function PreciosMatrix({
  productos,
  sucursales,
  overrides,
}: {
  productos: Prod[];
  sucursales: Suc[];
  overrides: Record<string, number>; // `${prod}_${suc}` -> precio
}) {
  // editable values keyed `${prod}_${suc}` ; "" = usa base
  const initial = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of productos)
      for (const s of sucursales) {
        const k = `${p.id}_${s.id}`;
        m[k] = overrides[k] != null ? String(overrides[k]) : "";
      }
    return m;
  }, [productos, sucursales, overrides]);

  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => {
    setVals((p) => ({ ...p, [k]: v }));
    setDirty((d) => new Set(d).add(k));
  };

  const save = () =>
    start(async () => {
      const items = [...dirty].map((k) => {
        const [producto_id, sucursal_id] = k.split("_").map(Number);
        const raw = vals[k].trim();
        return { producto_id, sucursal_id, precio: raw === "" ? null : parseFloat(raw) };
      });
      if (items.length) await savePreciosBatch(items);
      setDirty(new Set());
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-bg-muted">
          Vacío = precio base. Con valor = precio especial de esa sucursal.
        </p>
        <button
          onClick={save}
          disabled={pending || dirty.size === 0}
          className="btn-primary"
        >
          {pending ? "Guardando…" : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? "Guardado" : `Guardar${dirty.size ? ` (${dirty.size})` : ""}`}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface-2/70 px-3 py-3 text-left font-semibold text-on-bg-muted">
                Producto
              </th>
              {sucursales.map((s) => (
                <th key={s.id} className="px-2 py-3 text-center text-xs font-semibold text-on-bg-muted">
                  {s.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="sticky left-0 z-10 bg-surface px-3 py-2">
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-on-bg-muted">
                    base ${p.base} /{p.unidad}
                  </p>
                </td>
                {sucursales.map((s) => {
                  const k = `${p.id}_${s.id}`;
                  const v = vals[k] ?? "";
                  const diff = v !== "" && parseFloat(v) !== p.base;
                  return (
                    <td key={s.id} className="px-1.5 py-1.5">
                      <input
                        value={v}
                        onChange={(e) => set(k, e.target.value)}
                        inputMode="decimal"
                        placeholder={String(p.base)}
                        className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm outline-none focus:border-primary/50 ${
                          diff
                            ? "border-accent/60 bg-accent/10 font-semibold text-on-bg"
                            : "border-hairline bg-surface-2 text-on-bg-muted"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
