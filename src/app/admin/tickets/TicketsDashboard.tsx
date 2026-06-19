// @ts-nocheck
"use client";
import { useState, useTransition } from "react";
import { formatMXN } from "@/lib/format";

const ESTADOS = {
  vitrina: { label: "Vitrina", color: "bg-amber-500/10 text-amber-500" },
  despachado: { label: "Despachado", color: "bg-blue-500/10 text-blue-500" },
  pagado: { label: "Pagado", color: "bg-violet-500/10 text-violet-500" },
  entregado: { label: "Entregado", color: "bg-emerald-500/10 text-emerald-400" },
  invalido: { label: "Inválido", color: "bg-rose-500/10 text-rose-400" },
};

// Flujo: vitrina → despachado (cajero escanea) → pagado (cajero confirma pago) → entregado (revisor salida)
const FLUJO = { vitrina: "despachado", despachado: "pagado", pagado: "entregado" } as const;

type Cuadre = { total: number; en_caja: number; en_salida: number; pendientes_caja: number; monto_cerrado: number };
type Ticket = { id: number; numero: string; estado: string; monto: number | null; created_at: string; cliente_nombre: string | null };
type Sorteo = { id: number; titulo: string; premio: string; estado: string; numero_ganador: number | null; ganador_nombre: string | null };

export default function TicketsDashboard({
  cuadre, tickets, sorteos, fecha,
}: { cuadre: Cuadre; tickets: Ticket[]; sorteos: Sorteo[]; fecha: string }) {
  const [scan, setScan] = useState("");
  const [scanMsg, setScanMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tituloSorteo, setTituloSorteo] = useState("");
  const [premioSorteo, setPremioSorteo] = useState("");
  const [sorteoResult, setSorteoResult] = useState<{ numero: number; nombre: string | null } | null>(null);
  const [pending, start] = useTransition();

  const escanear = () => start(async () => {
    if (!scan.trim()) return;
    const res = await fetch("/api/tickets/scan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: scan.trim() }),
    });
    const d = await res.json();
    setScanMsg(res.ok
      ? { ok: true, msg: `✓ Ticket ${scan} → ${ESTADOS[d.estado_nuevo]?.label ?? d.estado_nuevo}` }
      : { ok: false, msg: d.error }
    );
    if (res.ok) setScan("");
  });

  const marcarInvalido = () => start(async () => {
    if (!scan.trim()) return;
    const res = await fetch("/api/tickets/scan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero: scan.trim(), forzar_invalido: true }),
    });
    const d = await res.json();
    setScanMsg(res.ok ? { ok: false, msg: `⚠ Ticket ${scan} marcado como INVÁLIDO` } : { ok: false, msg: d.error });
    if (res.ok) setScan("");
  });

  const crearSorteo = () => start(async () => {
    await fetch("/api/sorteos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: tituloSorteo, premio: premioSorteo }),
    });
    setTituloSorteo(""); setPremioSorteo("");
    window.location.reload();
  });

  const ejecutarSorteo = (id: number) => start(async () => {
    const res = await fetch("/api/sorteos/ejecutar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sorteo_id: id }),
    });
    const d = await res.json();
    if (res.ok) setSorteoResult({ numero: d.numero_ganador, nombre: d.ganador_nombre });
    else alert(d.error);
  });

  // KPIs basados en los nuevos estados
  const total = Number(cuadre.total ?? 0);
  const despachados = tickets.filter(t => ["despachado","pagado","entregado"].includes(t.estado)).length;
  const pagados = tickets.filter(t => ["pagado","entregado"].includes(t.estado)).length;
  const entregados = tickets.filter(t => t.estado === "entregado").length;
  const invalidos = tickets.filter(t => t.estado === "invalido").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Tickets y Trazabilidad</h1>
        <p className="text-sm text-on-bg-muted">Cuadre del día {fecha}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Generados hoy", val: total, color: "text-on-bg" },
          { label: "Despachados", val: despachados, color: "text-blue-400" },
          { label: "Pagados", val: pagados, color: "text-violet-400" },
          { label: "Entregados / Salida", val: entregados, color: "text-emerald-400" },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-on-bg-muted">{k.label}</p>
            <p className={`font-display text-3xl font-bold ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {invalidos > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
          ⚠ {invalidos} ticket{invalidos > 1 ? "s" : ""} marcado{invalidos > 1 ? "s" : ""} como inválido hoy
        </div>
      )}

      {/* Escáner */}
      <div className="card flex flex-col gap-3 p-5">
        <h2 className="font-bold">Escanear ticket</h2>
        <div className="grid grid-cols-1 gap-1.5 text-xs text-on-bg-muted">
          <p>📦 <strong>Vitrinero</strong> genera ticket → estado: Vitrina</p>
          <p>💳 <strong>Cajero</strong> escanea al cobrar → estado: Despachado → Pagado</p>
          <p>🚪 <strong>Revisor salida</strong> escanea al salir → estado: Entregado</p>
          <p>❌ <strong>Ticket inválido</strong> = ya usado, alterado o no autorizado</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Número de ticket (ej. T-123456-ABC)"
            value={scan}
            onChange={e => setScan(e.target.value)}
            onKeyDown={e => e.key === "Enter" && escanear()}
          />
          <button onClick={escanear} disabled={pending} className="btn-primary px-5">
            {pending ? "…" : "Escanear"}
          </button>
          <button onClick={marcarInvalido} disabled={pending || !scan.trim()} className="btn-ghost px-3 text-rose-400 border-rose-500/30">
            Inválido
          </button>
        </div>
        {scanMsg && (
          <p className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
            scanMsg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          }`}>{scanMsg.msg}</p>
        )}
      </div>

      {/* Últimos tickets */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">Últimos 50 tickets del día</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-on-bg-muted">
                <th className="pb-2 pr-4">Número</th>
                <th className="pb-2 pr-4">Estado</th>
                <th className="pb-2 pr-4">Cliente</th>
                <th className="pb-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-t border-hairline">
                  <td className="py-2 pr-4 font-mono text-xs">{t.numero}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADOS[t.estado]?.color ?? ""}`}>
                      {ESTADOS[t.estado]?.label ?? t.estado}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-on-bg-muted">{t.cliente_nombre ?? "—"}</td>
                  <td className="py-2">{t.monto ? formatMXN(Number(t.monto)) : "—"}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-on-bg-muted text-xs">Sin tickets hoy</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sorteos */}
      <div className="card p-5">
        <h2 className="mb-4 font-bold">Sorteos</h2>
        {sorteoResult && (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white">
            <p className="text-lg font-bold">🏆 Ganador del sorteo</p>
            <p className="font-display text-4xl font-extrabold">#{String(sorteoResult.numero).padStart(5,"0")}</p>
            {sorteoResult.nombre && <p className="text-white/80">{sorteoResult.nombre}</p>}
          </div>
        )}
        <div className="mb-4 flex flex-col gap-2">
          <input className="input" placeholder="Nombre del sorteo" value={tituloSorteo} onChange={e => setTituloSorteo(e.target.value)} />
          <input className="input" placeholder="Premio (ej. Microondas Samsung)" value={premioSorteo} onChange={e => setPremioSorteo(e.target.value)} />
          <button onClick={crearSorteo} disabled={pending || !tituloSorteo || !premioSorteo} className="btn-primary">
            Crear sorteo
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {sorteos.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-hairline p-4">
              <div>
                <p className="font-semibold">{s.titulo}</p>
                <p className="text-sm text-on-bg-muted">{s.premio}</p>
                {s.numero_ganador && (
                  <p className="text-sm font-bold text-emerald-400">
                    Ganador: #{String(s.numero_ganador).padStart(5,"0")} — {s.ganador_nombre ?? "sin registro"}
                  </p>
                )}
              </div>
              {s.estado === "programado" ? (
                <button onClick={() => ejecutarSorteo(s.id)} disabled={pending} className="btn-primary text-sm">
                  Ejecutar sorteo
                </button>
              ) : (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">Ejecutado</span>
              )}
            </div>
          ))}
          {sorteos.length === 0 && <p className="text-sm text-on-bg-muted">No hay sorteos creados aún.</p>}
        </div>
      </div>
    </div>
  );
}
