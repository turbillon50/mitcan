"use client";
import { useState, useTransition } from "react";

export default function SucursalAbiertaToggle({
  sucursalId, initialAbierta, initialRadio,
}: { sucursalId: number; initialAbierta: boolean; initialRadio: number }) {
  const [abierta, setAbierta] = useState(initialAbierta);
  const [radio, setRadio] = useState(initialRadio);
  const [pending, start] = useTransition();

  const toggle = () => start(async () => {
    const res = await fetch(`/api/sucursales/${sucursalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ abierta: !abierta }),
    });
    if (res.ok) setAbierta(a => !a);
  });

  const saveRadio = () => start(async () => {
    await fetch(`/api/sucursales/${sucursalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radio_km: radio }),
    });
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{abierta ? "Sucursal abierta para entregas" : "Sucursal cerrada"}</p>
          <p className="text-xs text-on-bg-muted">{abierta ? "Los clientes pueden pedir entrega a domicilio desde esta sucursal." : "No aparece como opción de entrega para clientes."}</p>
        </div>
        <button
          onClick={toggle}
          disabled={pending}
          className={`relative h-7 w-12 rounded-full transition-colors ${abierta ? "bg-primary" : "bg-surface-2 border border-hairline"}`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${abierta ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-on-bg-muted shrink-0">Radio de entrega (km)</label>
        <input
          type="number" min={1} max={500}
          className="input w-24 text-sm py-1.5"
          value={radio}
          onChange={e => setRadio(Number(e.target.value))}
        />
        <button onClick={saveRadio} disabled={pending} className="btn-ghost px-3 py-1.5 text-xs">
          Guardar
        </button>
      </div>
    </div>
  );
}
