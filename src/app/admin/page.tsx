import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  Clock,
  ChevronRight,
} from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";
import { VentasArea, EstadoPie } from "@/components/admin/Charts";
import StatusBadge from "@/components/StatusBadge";
import {
  getAdminKpis,
  getVentasUltimosDias,
  getVentasPorEstado,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatMXN, formatNumber, formatDateTime, serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [kpis, ventas, porEstado, recientes] = await Promise.all([
    getAdminKpis(),
    getVentasUltimosDias(14),
    getVentasPorEstado(),
    prisma.pedidos
      .findMany({
        include: { user: true, sucursal: true },
        orderBy: { created_at: "desc" },
        take: 6,
      })
      .catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <div className="csn-gradient flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline p-6">
        <div>
          <h1 className="section-title text-2xl">Centro de control CSN</h1>
          <p className="text-sm text-on-bg-muted">
            Resumen del negocio en tiempo real
          </p>
        </div>
        <span className="chip chip-active">
          {new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ventas totales"
          value={formatMXN(kpis.ventasTotal)}
          icon={DollarSign}
        />
        <KpiCard
          label="Pedidos"
          value={formatNumber(kpis.totalPedidos)}
          icon={ShoppingCart}
          hint={`${kpis.pendientes} pendientes`}
        />
        <KpiCard
          label="Usuarios"
          value={formatNumber(kpis.totalUsuarios)}
          icon={Users}
        />
        <KpiCard
          label="Sucursales activas"
          value={formatNumber(kpis.totalSucursales)}
          icon={Store}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Ventas · últimos 14 días</h2>
          <VentasArea data={serialize(ventas)} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Pedidos por estado</h2>
          {porEstado.length ? (
            <EstadoPie data={serialize(porEstado)} />
          ) : (
            <p className="py-16 text-center text-sm text-on-bg-muted">
              Sin datos aún
            </p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Clock size={16} className="text-primary" /> Pedidos recientes
          </h2>
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-1 text-sm text-primary"
          >
            Ver todos <ChevronRight size={15} />
          </Link>
        </div>
        {recientes.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-on-bg-muted">
            Aún no hay pedidos.
          </p>
        ) : (
          <div className="divide-y divide-hairline">
            {recientes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-5 py-3.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {p.folio ?? `#${p.id}`} ·{" "}
                    <span className="text-on-bg-muted">
                      {p.user?.nombre ?? p.user?.email ?? "Cliente"}
                    </span>
                  </p>
                  <p className="text-xs text-on-bg-muted">
                    {p.sucursal?.nombre ?? "—"} · {formatDateTime(p.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatMXN(Number(p.total))}</span>
                  <StatusBadge estado={p.estado} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
