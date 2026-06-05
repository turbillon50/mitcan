import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, Receipt, Clock, Bike, Star,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureOnlineSchema } from "@/lib/online";
import { formatMXN } from "@/lib/format";
import KpiCard from "@/components/admin/KpiCard";
import { VentasArea, TopProductosBar } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

const RANGOS: Record<string, { label: string; dias: number }> = {
  "7d": { label: "7 días", dias: 7 },
  "30d": { label: "30 días", dias: 30 },
  "90d": { label: "90 días", dias: 90 },
};

export default async function Estadisticas({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const sp = await searchParams;
  const rango = RANGOS[sp.r ?? "30d"] ? (sp.r ?? "30d") : "30d";
  const dias = RANGOS[rango].dias;
  const desde = new Date(Date.now() - dias * 86400_000);

  await ensureOnlineSchema().catch(() => null);

  

  const [kpis, porDia, topProductos, porCategoria, porHora, porRepartidor, clientes, encuesta] =
    await Promise.all([
      prisma.$queryRawUnsafe<Array<{ pedidos: bigint; ventas: number | null; ticket: number | null; entregados: bigint }>>(
        `SELECT count(*)::bigint AS pedidos,
                COALESCE(sum(total),0)::float AS ventas,
                COALESCE(avg(total),0)::float AS ticket,
                count(*) FILTER (WHERE status IN ('ha_llegado','entregado'))::bigint AS entregados
         FROM pedidos WHERE created_at >= $1 AND status IS DISTINCT FROM 'cancelado'`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ fecha: string; ventas: number; pedidos: number }>>(
        `SELECT to_char(date_trunc('day', created_at), 'DD Mon') AS fecha,
                COALESCE(sum(total),0)::float AS ventas, count(*)::int AS pedidos
         FROM pedidos WHERE created_at >= $1 AND status IS DISTINCT FROM 'cancelado'
         GROUP BY date_trunc('day', created_at) ORDER BY date_trunc('day', created_at)`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ nombre: string; ingresos: number; unidades: number }>>(
        `SELECT pr.name AS nombre, COALESCE(sum(pi.subtotal),0)::float AS ingresos,
                COALESCE(sum(pi.cantidad),0)::float AS unidades
         FROM pedido_items pi
         JOIN pedidos p ON p.id = pi.pedido_id AND p.created_at >= $1 AND p.status IS DISTINCT FROM 'cancelado'
         JOIN productos pr ON pr.id = pi.producto_id
         GROUP BY pr.name ORDER BY ingresos DESC LIMIT 8`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ categoria: string; ingresos: number }>>(
        `SELECT COALESCE(c.name,'Sin categoría') AS categoria, COALESCE(sum(pi.subtotal),0)::float AS ingresos
         FROM pedido_items pi
         JOIN pedidos p ON p.id = pi.pedido_id AND p.created_at >= $1 AND p.status IS DISTINCT FROM 'cancelado'
         JOIN productos pr ON pr.id = pi.producto_id
         LEFT JOIN categorias c ON c.id = pr.categoria_id
         GROUP BY c.name ORDER BY ingresos DESC`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ hora: number; pedidos: number }>>(
        `SELECT extract(hour FROM created_at AT TIME ZONE 'America/Mazatlan')::int AS hora, count(*)::int AS pedidos
         FROM pedidos WHERE created_at >= $1 AND status IS DISTINCT FROM 'cancelado'
         GROUP BY 1 ORDER BY pedidos DESC LIMIT 5`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ repartidor: string; entregas: number; ventas: number }>>(
        `SELECT repartidor, count(*)::int AS entregas, COALESCE(sum(total),0)::float AS ventas
         FROM pedidos
         WHERE created_at >= $1 AND repartidor IS NOT NULL AND status IS DISTINCT FROM 'cancelado'
         GROUP BY repartidor ORDER BY entregas DESC LIMIT 8`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ nombre: string | null; email: string | null; compras: number; gastado: number }>>(
        `SELECT u.name AS nombre, u.email, count(*)::int AS compras, COALESCE(sum(p.total),0)::float AS gastado
         FROM pedidos p JOIN users u ON u.id = p.cliente_id
         WHERE p.created_at >= $1 AND p.status IS DISTINCT FROM 'cancelado'
         GROUP BY u.id, u.name, u.email ORDER BY compras DESC, gastado DESC LIMIT 8`,
        desde
      ).catch(() => []),
      prisma.$queryRawUnsafe<Array<{ promedio: number | null; respuestas: bigint; completos: bigint }>>(
        `SELECT avg(estrellas)::float AS promedio, count(*)::bigint AS respuestas,
                count(*) FILTER (WHERE completo)::bigint AS completos
         FROM encuestas e JOIN pedidos p ON p.id = e.pedido_id WHERE p.created_at >= $1`,
        desde
      ).catch(() => []),
    ]);

  const k = kpis[0];
  const enc = encuesta[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-2xl">Estadísticas comerciales</h1>
          <p className="text-sm text-on-bg-muted">Últimos {RANGOS[rango].label}</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(RANGOS).map(([key, r]) => (
            <Link key={key} href={`/admin/estadisticas?r=${key}`}
              className={`chip ${rango === key ? "chip-active" : ""}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ventas" value={formatMXN(Number(k?.ventas ?? 0))} icon={TrendingUp} />
        <KpiCard label="Pedidos" value={Number(k?.pedidos ?? 0)} icon={ShoppingBag}
          hint={`${Number(k?.entregados ?? 0)} entregados`} />
        <KpiCard label="Ticket promedio" value={formatMXN(Number(k?.ticket ?? 0))} icon={Receipt} />
        <KpiCard label="Satisfacción" icon={Star}
          value={enc?.promedio ? `${Number(enc.promedio).toFixed(1)} ★` : "—"}
          hint={enc?.respuestas ? `${Number(enc.respuestas)} encuestas · ${Number(enc.completos)} completos` : "Sin encuestas aún"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Ventas por día</h2>
          {porDia.length === 0 ? <Empty /> : <VentasArea data={porDia} />}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Productos más vendidos</h2>
          {topProductos.length === 0 ? <Empty /> : (
            <TopProductosBar data={topProductos.map((t) => ({ nombre: t.nombre, ingresos: t.ingresos }))} />
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Clock size={17} className="text-primary" /> Horarios de mayor demanda
          </h2>
          {porHora.length === 0 ? <Empty /> : (
            <ul className="flex flex-col gap-2 text-sm">
              {porHora.map((h) => (
                <li key={h.hora} className="flex justify-between">
                  <span>{String(h.hora).padStart(2, "0")}:00 — {String(h.hora).padStart(2, "0")}:59</span>
                  <span className="font-bold">{h.pedidos} pedidos</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Bike size={17} className="text-primary" /> Por repartidor
          </h2>
          {porRepartidor.length === 0 ? <Empty /> : (
            <ul className="flex flex-col gap-2 text-sm">
              {porRepartidor.map((r) => (
                <li key={r.repartidor} className="flex justify-between gap-2">
                  <span className="truncate">{r.repartidor}</span>
                  <span className="shrink-0 text-on-bg-muted">{r.entregas} · {formatMXN(r.ventas)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Ventas por categoría</h2>
          {porCategoria.length === 0 ? <Empty /> : (
            <ul className="flex flex-col gap-2 text-sm">
              {porCategoria.map((c) => (
                <li key={c.categoria} className="flex justify-between gap-2">
                  <span className="truncate">{c.categoria}</span>
                  <span className="shrink-0 font-bold">{formatMXN(c.ingresos)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="flex items-center gap-2 p-5 pb-3 font-display text-lg font-bold">
          <Users size={17} className="text-primary" /> Clientes frecuentes
        </h2>
        <table className="w-full text-sm">
          <thead className="border-y border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Compras</th>
              <th className="px-5 py-3 text-right">Gastado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {clientes.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-on-bg-muted">Sin datos en el periodo.</td></tr>
            )}
            {clientes.map((c, i) => (
              <tr key={i}>
                <td className="px-5 py-3">
                  <p className="font-medium">{c.nombre ?? "—"}</p>
                  <p className="text-xs text-on-bg-muted">{c.email}</p>
                </td>
                <td className="px-5 py-3">{c.compras}</td>
                <td className="px-5 py-3 text-right font-medium">{formatMXN(c.gastado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-on-bg-muted">Sin datos en el periodo.</p>;
}
