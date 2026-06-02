import { prisma } from "./prisma";

/** Run a Prisma query, returning a fallback if the DB is unreachable
 *  (e.g. during build-time prerender or a transient outage). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[CSN] DB query failed:", (err as Error)?.message);
    return fallback;
  }
}

export const AREA_LABELS: Record<string, string> = {
  tepic: "Área Tepic",
  mazatlan: "Área Mazatlán",
  vallarta: "Área Vallarta",
  bahia: "Área Bahía de Banderas",
  foraneas: "Área Foráneas Nayarit",
};

export function getCategorias() {
  return safe(
    () => prisma.categorias.findMany({ orderBy: { orden: "asc" } }),
    []
  );
}

export function getProductosConCategoria(opts?: { soloActivos?: boolean }) {
  return safe(
    () =>
      prisma.productos.findMany({
        where: opts?.soloActivos ? { activo: true } : undefined,
        include: { categoria: true },
        orderBy: [{ destacado: "desc" }, { nombre: "asc" }],
      }),
    []
  );
}

export function getSucursales(opts?: { soloActivas?: boolean }) {
  return safe(
    () =>
      prisma.sucursales.findMany({
        where: opts?.soloActivas ? { activa: true } : undefined,
        orderBy: { id: "asc" },
      }),
    []
  );
}

export function getRecompensas(opts?: { soloActivas?: boolean }) {
  return safe(
    () =>
      prisma.recompensas.findMany({
        where: opts?.soloActivas ? { activa: true } : undefined,
        orderBy: { puntos_requeridos: "asc" },
      }),
    []
  );
}

/** ---- Admin KPI aggregates ---- */
export async function getAdminKpis() {
  return safe(
    async () => {
      const [
        totalPedidos,
        totalUsuarios,
        totalProductos,
        totalSucursales,
        ventasAgg,
        pendientes,
      ] = await Promise.all([
        prisma.pedidos.count(),
        prisma.users.count(),
        prisma.productos.count({ where: { activo: true } }),
        prisma.sucursales.count({ where: { activa: true } }),
        prisma.pedidos.aggregate({
          _sum: { total: true },
          where: { estado: { not: "cancelado" } },
        }),
        prisma.pedidos.count({ where: { estado: "pendiente" } }),
      ]);
      return {
        totalPedidos,
        totalUsuarios,
        totalProductos,
        totalSucursales,
        ventasTotal: Number(ventasAgg._sum.total ?? 0),
        pendientes,
      };
    },
    {
      totalPedidos: 0,
      totalUsuarios: 0,
      totalProductos: 0,
      totalSucursales: 0,
      ventasTotal: 0,
      pendientes: 0,
    }
  );
}

export async function getVentasPorEstado() {
  return safe(
    async () => {
      const rows = await prisma.pedidos.groupBy({
        by: ["estado"],
        _count: { _all: true },
        _sum: { total: true },
      });
      return rows.map((r) => ({
        estado: r.estado,
        pedidos: r._count._all,
        total: Number(r._sum.total ?? 0),
      }));
    },
    [] as { estado: string; pedidos: number; total: number }[]
  );
}

export async function getTopProductos(limit = 6) {
  return safe(
    async () => {
      const grouped = await prisma.pedido_items.groupBy({
        by: ["producto_id"],
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: limit,
      });
      const ids = grouped.map((g) => g.producto_id).filter(Boolean) as number[];
      const productos = await prisma.productos.findMany({
        where: { id: { in: ids } },
      });
      const byId = new Map(productos.map((p) => [p.id, p]));
      return grouped.map((g) => ({
        nombre: byId.get(g.producto_id ?? -1)?.nombre ?? "—",
        cantidad: Number(g._sum.cantidad ?? 0),
        ingresos: Number(g._sum.subtotal ?? 0),
      }));
    },
    [] as { nombre: string; cantidad: number; ingresos: number }[]
  );
}

export async function getVentasUltimosDias(dias = 14) {
  return safe(
    async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - dias);
      const pedidos = await prisma.pedidos.findMany({
        where: { created_at: { gte: desde }, estado: { not: "cancelado" } },
        select: { created_at: true, total: true },
      });
      const buckets = new Map<string, { ventas: number; pedidos: number }>();
      for (let i = 0; i < dias; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (dias - 1 - i));
        buckets.set(d.toISOString().slice(0, 10), { ventas: 0, pedidos: 0 });
      }
      for (const p of pedidos) {
        const key = p.created_at.toISOString().slice(0, 10);
        const b = buckets.get(key);
        if (b) {
          b.ventas += Number(p.total);
          b.pedidos += 1;
        }
      }
      return Array.from(buckets.entries()).map(([fecha, v]) => ({
        fecha: fecha.slice(5),
        ...v,
      }));
    },
    [] as { fecha: string; ventas: number; pedidos: number }[]
  );
}
