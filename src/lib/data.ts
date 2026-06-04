import { prisma, withRetry } from "./prisma";

/** Run a Prisma query (with transient-error retry), returning a fallback if the
 *  DB is unreachable (e.g. during build-time prerender or a transient outage). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await withRetry(fn);
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

export async function getContent<T = unknown>(key: string): Promise<T | null> {
  return safe(async () => {
    const row = await prisma.content_blocks.findUnique({ where: { key } });
    return (row?.content as T) ?? null;
  }, null);
}

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
        orderBy: { nombre: "asc" },
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

export function getPromocionesActivas(limit = 12) {
  const now = new Date();
  return safe(
    () =>
      prisma.promociones.findMany({
        where: {
          activa: true,
          AND: [
            { OR: [{ fecha_inicio: null }, { fecha_inicio: { lte: now } }] },
            { OR: [{ fecha_fin: null }, { fecha_fin: { gte: now } }] },
          ],
        },
        orderBy: [{ orden: "asc" }, { id: "desc" }],
        take: limit,
        include: { producto: true },
      }),
    []
  );
}

export async function getVentasPorSucursal() {
  return safe(
    async () => {
      const rows = await prisma.pedidos.groupBy({
        by: ["sucursal_id"],
        _count: { _all: true },
        _sum: { total: true },
        where: { estado: { not: "cancelado" } },
      });
      const ids = rows.map((r) => r.sucursal_id).filter(Boolean) as number[];
      const sucs = await prisma.sucursales.findMany({ where: { id: { in: ids } } });
      const byId = new Map(sucs.map((s) => [s.id, s.nombre]));
      return rows
        .map((r) => ({
          sucursal: byId.get(r.sucursal_id ?? -1) ?? "Sin sucursal",
          pedidos: r._count._all,
          total: Number(r._sum.total ?? 0),
        }))
        .sort((a, b) => b.total - a.total);
    },
    [] as { sucursal: string; pedidos: number; total: number }[]
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

/** Per-branch aggregates for the C4 control map (real data). */
export async function getC4Sucursales() {
  return safe(
    async () => {
      const [sucs, inv, ventas] = await Promise.all([
        prisma.sucursales.findMany({ orderBy: { id: "asc" } }),
        prisma.inventario.findMany({
          select: {
            sucursal_id: true,
            stock: true,
            min_stock: true,
            precio: true,
            producto: { select: { precio: true } },
          },
        }),
        prisma.pedidos.groupBy({
          by: ["sucursal_id"],
          _count: { _all: true },
          _sum: { total: true },
          where: { estado: { not: "cancelado" } },
        }),
      ]);

      const ventasById = new Map(
        ventas.map((v) => [
          v.sucursal_id,
          { pedidos: v._count._all, total: Number(v._sum.total ?? 0) },
        ])
      );

      const agg = new Map<
        number,
        { valor: number; bajo: number; agotados: number; items: number }
      >();
      for (const r of inv) {
        if (r.sucursal_id == null) continue;
        const a = agg.get(r.sucursal_id) ?? { valor: 0, bajo: 0, agotados: 0, items: 0 };
        const stock = Number(r.stock ?? 0);
        const precio = Number(r.precio ?? r.producto?.precio ?? 0);
        a.valor += stock * precio;
        a.items += 1;
        if (stock <= 0) a.agotados += 1;
        else if (stock <= Number(r.min_stock ?? 5)) a.bajo += 1;
        agg.set(r.sucursal_id, a);
      }

      return sucs.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        area: s.area,
        direccion: s.direccion,
        telefono: s.telefono,
        whatsapp: s.whatsapp,
        activa: s.activa ?? true,
        lat: s.lat != null ? Number(s.lat) : null,
        lng: s.lng != null ? Number(s.lng) : null,
        valorInventario: agg.get(s.id)?.valor ?? 0,
        items: agg.get(s.id)?.items ?? 0,
        stockBajo: agg.get(s.id)?.bajo ?? 0,
        agotados: agg.get(s.id)?.agotados ?? 0,
        ventas: ventasById.get(s.id)?.total ?? 0,
        pedidos: ventasById.get(s.id)?.pedidos ?? 0,
      }));
    },
    [] as {
      id: number;
      nombre: string;
      area: string | null;
      direccion: string | null;
      telefono: string | null;
      whatsapp: string | null;
      activa: boolean;
      lat: number | null;
      lng: number | null;
      valorInventario: number;
      items: number;
      stockBajo: number;
      agotados: number;
      ventas: number;
      pedidos: number;
    }[]
  );
}
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
        prisma.pedidos.count({ where: { estado: "nuevo" } }),
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
        estado: r.estado ?? "nuevo",
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
        if (!p.created_at) continue;
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

type LowStock = { producto: string; sucursal: string; stock: number; min: number };

/** Operational overview: catalog, marketing and inventory health (low-stock,
 *  out-of-stock and estimated inventory value). */
export async function getOperacionResumen() {
  return safe(
    async () => {
      const [
        productosActivos,
        categoriasCount,
        promosActivas,
        recompensasActivas,
        redencionesCount,
        clientes,
        inventario,
      ] = await Promise.all([
        prisma.productos.count({ where: { activo: true } }),
        prisma.categorias.count(),
        prisma.promociones.count({ where: { activa: true } }),
        prisma.recompensas.count({ where: { activa: true } }),
        prisma.redenciones.count(),
        prisma.users.count({ where: { rol: "cliente" } }),
        prisma.inventario.findMany({ include: { producto: true, sucursal: true } }),
      ]);

      let valorInventario = 0;
      let agotados = 0;
      const lowStock: LowStock[] = [];
      for (const i of inventario) {
        const stock = Number(i.stock ?? 0);
        const min = Number(i.min_stock ?? 0);
        const precio = Number(i.precio ?? i.producto?.precio ?? 0);
        valorInventario += stock * precio;
        if (stock <= 0) agotados++;
        else if (min > 0 && stock <= min) {
          lowStock.push({
            producto: i.producto?.nombre ?? "—",
            sucursal: i.sucursal?.nombre ?? "—",
            stock,
            min,
          });
        }
      }
      lowStock.sort((a, b) => a.stock - b.stock);

      return {
        productosActivos,
        categoriasCount,
        promosActivas,
        recompensasActivas,
        redencionesCount,
        clientes,
        inventarioItems: inventario.length,
        valorInventario,
        agotados,
        lowStockCount: lowStock.length,
        lowStock: lowStock.slice(0, 8),
      };
    },
    {
      productosActivos: 0,
      categoriasCount: 0,
      promosActivas: 0,
      recompensasActivas: 0,
      redencionesCount: 0,
      clientes: 0,
      inventarioItems: 0,
      valorInventario: 0,
      agotados: 0,
      lowStockCount: 0,
      lowStock: [] as LowStock[],
    }
  );
}
