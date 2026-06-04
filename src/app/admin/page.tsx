import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  Clock,
  ChevronRight,
  TrendingUp,
  Beef,
  Tags,
  Boxes,
  Megaphone,
  Gift,
  AlertTriangle,
  PackageX,
  Warehouse,
  Plus,
} from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";
import { VentasArea, EstadoPie, TopProductosBar } from "@/components/admin/Charts";
import StatusBadge from "@/components/StatusBadge";
import {
  getAdminKpis,
  getOperacionResumen,
  getVentasUltimosDias,
  getVentasPorEstado,
  getVentasPorSucursal,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatMXN, formatNumber, formatDateTime, serialize } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const QUICK = [
  { href: "/admin/productos", label: "Producto", icon: Beef },
  { href: "/admin/promociones", label: "Promoción", icon: Megaphone },
  { href: "/admin/sucursales", label: "Sucursal", icon: Store },
  { href: "/admin/usuarios", label: "Invitar", icon: Users },
];

export default async function AdminDashboard() {
  const [kpis, op, ventas, porEstado, porSucursal, recientes] = await Promise.all([
    getAdminKpis(),
    getOperacionResumen(),
    getVentasUltimosDias(14),
    getVentasPorEstado(),
    getVentasPorSucursal(),
    prisma.pedidos
      .findMany({
        include: { user: true, sucursal: true },
        orderBy: { created_at: "desc" },
        take: 6,
      })
      .catch(() => []),
  ]);

  const ticket = kpis.totalPedidos > 0 ? kpis.ventasTotal / kpis.totalPedidos : 0;
  const locale = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero + quick actions */}
      <div className="csn-gradient flex flex-col gap-4 rounded-2xl border border-hairline p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title text-2xl">{t(locale, "adm.dashTitle")}</h1>
            <p className="text-sm text-on-bg-muted">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="btn-ghost px-3 py-2 text-xs">
                <Plus size={13} /> <Icon size={14} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Alert: low stock / out of stock */}
      {(op.lowStockCount > 0 || op.agotados > 0) && (
        <Link
          href="/admin/inventario"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm transition hover:bg-amber-500/15"
        >
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <span className="font-medium text-amber-700">
            {op.agotados > 0 && `${op.agotados} agotado(s)`}
            {op.agotados > 0 && op.lowStockCount > 0 && " · "}
            {op.lowStockCount > 0 && `${op.lowStockCount} con stock bajo`}
          </span>
          <ChevronRight size={16} className="ml-auto text-amber-600" />
        </Link>
      )}

      {/* Ventas / pedidos KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ventas totales" value={formatMXN(kpis.ventasTotal)} icon={DollarSign} />
        <KpiCard
          label="Pedidos"
          value={formatNumber(kpis.totalPedidos)}
          icon={ShoppingCart}
          hint={`${kpis.pendientes} pendientes`}
        />
        <KpiCard label="Ticket promedio" value={formatMXN(ticket)} icon={TrendingUp} />
        <KpiCard label="Clientes" value={formatNumber(op.clientes)} icon={Users} />
      </div>

      {/* Operación / inventario */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-on-bg-muted">
          Operación e inventario
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
          <MiniStat label="Productos" value={op.productosActivos} icon={Beef} href="/admin/productos" />
          <MiniStat label="Categorías" value={op.categoriasCount} icon={Tags} href="/admin/categorias" />
          <MiniStat label="Sucursales" value={kpis.totalSucursales} icon={Store} href="/admin/sucursales" />
          <MiniStat
            label="Valor inventario"
            value={formatMXN(op.valorInventario)}
            icon={Warehouse}
            href="/admin/inventario"
          />
          <MiniStat
            label="Stock bajo"
            value={op.lowStockCount}
            icon={Boxes}
            href="/admin/inventario"
            danger={op.lowStockCount > 0}
          />
          <MiniStat
            label="Agotados"
            value={op.agotados}
            icon={PackageX}
            href="/admin/inventario"
            danger={op.agotados > 0}
          />
        </div>
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
            <EmptyChart />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Ventas por sucursal</h2>
          {porSucursal.length ? (
            <TopProductosBar
              data={serialize(porSucursal.map((s) => ({ nombre: s.sucursal, ingresos: s.total })))}
            />
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Low stock list */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold">
              <Boxes size={16} className="text-primary" /> Reabastecer
            </h2>
            <Link href="/admin/inventario" className="text-sm text-primary">
              Inventario
            </Link>
          </div>
          {op.lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-on-bg-muted">
              Inventario sano — sin alertas de stock bajo. ✅
            </p>
          ) : (
            <div className="divide-y divide-hairline">
              {op.lowStock.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l.producto}</p>
                    <p className="text-xs text-on-bg-muted">{l.sucursal}</p>
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {l.stock} / mín {l.min}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marketing mini-row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Promos activas" value={op.promosActivas} icon={Megaphone} href="/admin/promociones" />
        <MiniStat label="Recompensas" value={op.recompensasActivas} icon={Gift} href="/admin/recompensas" />
        <MiniStat label="Canjes" value={op.redencionesCount} icon={Gift} href="/admin/redenciones" />
        <MiniStat label="Usuarios" value={kpis.totalUsuarios} icon={Users} href="/admin/usuarios" />
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Clock size={16} className="text-primary" /> Pedidos recientes
          </h2>
          <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm text-primary">
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
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
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

function MiniStat({
  label,
  value,
  icon: Icon,
  href,
  danger,
}: {
  label: string;
  value: string | number;
  icon: typeof Beef;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card flex flex-col gap-1 p-4 transition hover:border-primary/30 ${
        danger ? "border-amber-500/30 bg-amber-500/5" : ""
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          danger ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="mt-1 text-lg font-bold leading-tight">{value}</span>
      <span className="text-xs text-on-bg-muted">{label}</span>
    </Link>
  );
}

function EmptyChart() {
  return (
    <p className="py-16 text-center text-sm text-on-bg-muted">
      Sin datos todavía — aparecerá cuando haya pedidos.
    </p>
  );
}
