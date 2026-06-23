// @ts-nocheck
"use client";
import { useEffect, useState, useTransition } from "react";
import { formatMXN } from "@/lib/format";

type Cuadre = {
  fecha: string;
  semaforo: "verde" | "amarillo" | "rojo";
  conteos: {
    total_generados: number; tickets_vitrina: number; tickets_despachados: number;
    tickets_pagados: number; tickets_entregados: number; tickets_invalidos: number;
  };
  montos: { pagado_sistema: number; efectivo_contado: number | null; diferencia: number | null };
  cuadra_conteos: boolean;
  alarmas: { tipo: string; nivel: string; mensaje: string; cantidad: number }[];
};

const SEMAFORO = {
  verde: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", icon: "✓", label: "Todo cuadra" },
  amarillo: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", icon: "!", label: "Revisar" },
  rojo: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500", icon: "✕", label: "Hay fuga" },
};

const NIVEL = {
  critica: "bg-rose-500/10 text-rose-500 border-rose-500/30",
  alta: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  media: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default function CuadreDiario() {
  const [cuadre, setCuadre] = useState<Cuadre | null>(null);
  const [loading, setLoading] = useState(true);
  const [efectivo, setEfectivo] = useState("");
  const [cierreMsg, setCierreMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pending, start] = useTransition();

  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargar = () => {
    setLoading(true);
    setErrorCarga(null);
    fetch("/api/tickets/cuadre")
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d || !d.semaforo) {
          // La API falló o devolvió algo inesperado (sesión expirada, error, etc.)
          setErrorCarga(d?.error ?? "No se pudo cargar el cuadre");
          setCuadre(null);
        } else {
          setCuadre(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setErrorCarga("Error de conexión al cargar el cuadre");
        setLoading(false);
      });
  };

  useEffect(() => { cargar(); }, []);

  const cerrarCaja = () => start(async () => {
    if (!efectivo.trim()) return;
    const res = await fetch("/api/tickets/cierre", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ efectivo_contado: Number(efectivo) }),
    });
    const d = await res.json();
    if (res.ok) {
      setCierreMsg({
        ok: d.cuadra,
        msg: d.cuadra
          ? `✓ Caja cuadra perfecto: ${formatMXN(d.total_sistema)}`
          : d.diferencia < 0
            ? `⚠ Faltan ${formatMXN(Math.abs(d.diferencia))} (sistema: ${formatMXN(d.total_sistema)}, contado: ${formatMXN(d.efectivo_contado)})`
            : `⚠ Sobran ${formatMXN(d.diferencia)} (sistema: ${formatMXN(d.total_sistema)}, contado: ${formatMXN(d.efectivo_contado)})`,
      });
      setEfectivo("");
      cargar();
    } else {
      setCierreMsg({ ok: false, msg: d.error });
    }
  });

  if (loading) return <div className="card h-48 animate-pulse bg-surface-2" />;

  // Si la API falló o no hay datos válidos, mostrar aviso en vez de tronar.
  if (!cuadre || !cuadre.semaforo) {
    return (
      <div className="card p-5">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          {errorCarga ?? "Cargando cuadre…"}
          <button
            onClick={cargar}
            className="ml-3 rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/30"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Semáforo con fallback seguro por si llega un valor inesperado.
  const s = SEMAFORO[cuadre.semaforo] ?? SEMAFORO.verde;
  const conteos = cuadre.conteos ?? { total_generados: 0, tickets_vitrina: 0, tickets_despachados: 0, tickets_pagados: 0, tickets_entregados: 0, tickets_invalidos: 0 };
  const montos = cuadre.montos ?? { pagado_sistema: 0, efectivo_contado: null, diferencia: null };
  const alarmas = Array.isArray(cuadre.alarmas) ? cuadre.alarmas : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Semáforo principal */}
      <div className={`card border-2 ${s.border} ${s.bg} p-6`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${s.bg} border-2 ${s.border} text-3xl font-bold ${s.text}`}>
            {s.icon}
          </div>
          <div>
            <p className={`font-display text-2xl font-bold ${s.text}`}>{s.label}</p>
            <p className="text-sm text-on-bg-muted">Cuadre del día {cuadre.fecha}</p>
          </div>
        </div>
      </div>

      {/* Conteos de los 3 puntos */}
      <div className="card p-5">
        <h3 className="mb-4 font-bold">Trazabilidad del día</h3>
        <div className="flex items-center justify-between gap-2">
          {[
            { label: "Vitrina", val: conteos.tickets_vitrina, color: "text-amber-500", desc: "salieron" },
            { label: "Pagados", val: conteos.tickets_pagados, color: "text-blue-500", desc: "cobrados" },
            { label: "Entregados", val: conteos.tickets_entregados, color: "text-emerald-500", desc: "verificados" },
          ].map((p, i) => (
            <div key={p.label} className="flex flex-1 items-center">
              <div className="flex-1 text-center">
                <p className={`font-display text-3xl font-bold ${p.color}`}>{p.val}</p>
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[10px] text-on-bg-muted">{p.desc}</p>
              </div>
              {i < 2 && <span className="px-1 text-xl text-on-bg-muted">→</span>}
            </div>
          ))}
        </div>
        {conteos.tickets_invalidos > 0 && (
          <p className="mt-3 text-center text-xs text-rose-400">
            {conteos.tickets_invalidos} ticket(s) inválido(s)
          </p>
        )}
      </div>

      {/* Alarmas */}
      {alarmas.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-bold text-rose-400">⚠ Señales de alarma</h3>
          <div className="flex flex-col gap-2">
            {alarmas.map((a, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3 text-sm ${NIVEL[a.nivel] ?? NIVEL.media}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.mensaje}</span>
                  <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase">{a.nivel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alarmas.length === 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
          ✓ Sin anomalías detectadas hoy. Todos los tickets siguieron el flujo correcto.
        </div>
      )}

      {/* Cierre de caja */}
      <div className="card p-5">
        <h3 className="mb-1 font-bold">Cierre de caja</h3>
        <p className="mb-3 text-xs text-on-bg-muted">
          Cuenta el efectivo de la caja y regístralo. El sistema lo compara con lo cobrado.
        </p>
        <div className="mb-3 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
          <span className="text-sm text-on-bg-muted">Cobrado según el sistema hoy</span>
          <span className="font-display text-xl font-bold text-primary">{formatMXN(montos.pagado_sistema)}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number" inputMode="decimal"
            className="input flex-1"
            placeholder="Efectivo contado en caja"
            value={efectivo}
            onChange={e => setEfectivo(e.target.value)}
          />
          <button onClick={cerrarCaja} disabled={pending || !efectivo.trim()} className="btn-primary px-5">
            {pending ? "…" : "Cerrar caja"}
          </button>
        </div>
        {cierreMsg && (
          <p className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
            cierreMsg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-400"
          }`}>{cierreMsg.msg}</p>
        )}
        {montos.diferencia !== null && (
          <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
            montos.diferencia === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-400"
          }`}>
            {montos.diferencia === 0
              ? "✓ La caja cuadró perfecto hoy"
              : montos.diferencia < 0
                ? `Diferencia: faltan ${formatMXN(Math.abs(montos.diferencia))}`
                : `Diferencia: sobran ${formatMXN(montos.diferencia)}`}
          </div>
        )}
      </div>
    </div>
  );
}
