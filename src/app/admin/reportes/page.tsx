import { DollarSign, ShoppingCart, TrendingUp, Award } from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";
import { VentasArea, TopProductosBar, EstadoPie } from "@/components/admin/Charts";
import {
  getAdminKpis,
  getVentasUltimosDias,
  getVentasPorEstado,
  getTopProductos,
} from "@/lib/data";
import { formatMXN, formatNumber, serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReportes() {
  const [kpis, ventas, porEstado, top] = await Promise.all([
    getAdminKpis(),
    getVentasUltimosDias(30),
    getVentasPorEstado(),
    getTopProductos(6),
  ]);

  const ticketPromedio =
    kpis.totalPedidos > 0 ? kpis.ventasTotal / kpis.totalPedidos : 0;
  const entregados =
    porEstado.find((e) => e.estado === "entregado")?.pedidos ?? 0;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="section-title text-2xl">Reportes</h1>
        <p className="text-sm text-on-bg-muted">Analítica de ventas y productos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingresos" value={formatMXN(kpis.ventasTotal)} icon={DollarSign} />
        <KpiCard label="Pedidos" value={formatNumber(kpis.totalPedidos)} icon={ShoppingCart} />
        <KpiCard
          label="Ticket promedio"
          value={formatMXN(ticketPromedio)}
          icon={TrendingUp}
        />
        <KpiCard label="Entregados" value={formatNumber(entregados)} icon={Award} />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-bold">Ventas · últimos 30 días</h2>
        <VentasArea data={serialize(ventas)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Top productos por ingresos</h2>
          {top.length ? (
            <TopProductosBar data={serialize(top)} />
          ) : (
            <p className="py-16 text-center text-sm text-on-bg-muted">
              Sin ventas registradas aún
            </p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Distribución por estado</h2>
          {porEstado.length ? (
            <EstadoPie data={serialize(porEstado)} />
          ) : (
            <p className="py-16 text-center text-sm text-on-bg-muted">
              Sin datos aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
