import { prisma } from "./prisma";
import { sendPushToUser } from "./push";

/** Módulo PEDIDO EN LÍNEA — constantes y helpers compartidos. */

export { ENVIO_FIJO, TEL_PEDIDOS, TEL_PEDIDOS_DISPLAY, ESTADOS_ONLINE } from "./online-const";

export const PUSH_POR_ESTADO: Record<string, { title: string; body: string }> = {
  recibido: { title: "Pedido recibido 🥩", body: "Tu pedido fue recibido y está en cola." },
  en_preparacion: { title: "En preparación 🔪", body: "Estamos preparando tu pedido." },
  entregado_repartidor: { title: "Listo para salir 📦", body: "Tu pedido fue entregado al repartidor." },
  en_camino: { title: "En camino 🛵", body: "Tu pedido va en camino a tu dirección." },
  ha_llegado: { title: "¡Ha llegado! 🎉", body: "Tu pedido llegó. ¡Gracias por tu compra!" },
  cancelado: { title: "Pedido cancelado", body: "Tu pedido fue cancelado. Llámanos al 311 211 5253 si tienes dudas." },
};

/* ----------------------------------------------------------------------- *
 * Schema bootstrap — columnas/tablas nuevas del módulo, idempotente.
 * La DB existente tiene datos reales: NUNCA prisma migrate; solo ADD/CREATE
 * IF NOT EXISTS, igual que push_subscriptions en lib/push.ts.
 * ----------------------------------------------------------------------- */
let ensured = false;
export async function ensureOnlineSchema() {
  if (ensured) return;
  const stmts = [
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'mostrador'`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio numeric DEFAULT 0`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'contra_entrega'`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS direccion_entrega text`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefono_entrega text`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS repartidor text`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregado_at timestamptz`,
    `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entrega_confirmada boolean DEFAULT false`,
    `ALTER TABLE users   ADD COLUMN IF NOT EXISTS direccion text`,
    `CREATE TABLE IF NOT EXISTS pedido_eventos (
       id serial PRIMARY KEY,
       pedido_id int NOT NULL,
       estado text NOT NULL,
       nota text,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS encuestas (
       id serial PRIMARY KEY,
       pedido_id int UNIQUE NOT NULL,
       user_id text,
       completo boolean,
       estrellas int,
       comentarios text,
       created_at timestamptz DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS puntos_movimientos (
       id serial PRIMARY KEY,
       user_id text NOT NULL,
       pedido_id int,
       puntos int NOT NULL,
       tipo text DEFAULT 'compra',
       descripcion text,
       created_at timestamptz DEFAULT now()
     )`,
  ];
  for (const s of stmts) await prisma.$executeRawUnsafe(s);
  ensured = true;
}

/** Registra un evento de estado y dispara push + notificación in-app. */
export async function registrarEvento(
  pedidoId: number,
  estado: string,
  opts?: { userId?: string | null; folio?: string | null; nota?: string | null }
) {
  await ensureOnlineSchema();
  await prisma.$executeRawUnsafe(
    `INSERT INTO pedido_eventos (pedido_id, estado, nota) VALUES ($1, $2, $3)`,
    pedidoId,
    estado,
    opts?.nota ?? null
  );
  const msg = PUSH_POR_ESTADO[estado];
  if (msg && opts?.userId) {
    const url = opts.folio ? `/pedido/seguimiento/${opts.folio}` : "/app/pedido";
    await Promise.allSettled([
      sendPushToUser(opts.userId, { title: msg.title, body: msg.body, url }),
      prisma.notificaciones.create({
        data: { user_id: opts.userId, titulo: msg.title, mensaje: msg.body, tipo: "pedido" },
      }),
    ]);
  }
}

/** Acredita los puntos del pedido (una sola vez) cuando se entrega. */
export async function acreditarPuntos(pedido: {
  id: number;
  user_id: string | null;
  folio: string | null;
  puntos_ganados: number | null;
}) {
  if (!pedido.user_id || !pedido.puntos_ganados) return;
  await ensureOnlineSchema();
  const ya = await prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
    `SELECT count(*)::bigint AS n FROM puntos_movimientos WHERE pedido_id = $1 AND tipo = 'compra'`,
    pedido.id
  );
  if (Number(ya[0]?.n ?? 0) > 0) return;
  await prisma.$executeRawUnsafe(
    `INSERT INTO puntos_movimientos (user_id, pedido_id, puntos, tipo, descripcion)
     VALUES ($1, $2, $3, 'compra', $4)`,
    pedido.user_id,
    pedido.id,
    pedido.puntos_ganados,
    `Compra ${pedido.folio ?? `#${pedido.id}`}`
  );
  await prisma.users.update({
    where: { id: pedido.user_id },
    data: { puntos: { increment: pedido.puntos_ganados } },
  });
}

/** Stock disponible por producto (suma de inventario en todas las sucursales). */
export async function getStockMap(productoIds?: number[]) {
  const rows = await prisma.inventario.groupBy({
    by: ["producto_id"],
    _sum: { stock: true },
    where: productoIds?.length ? { producto_id: { in: productoIds } } : undefined,
  });
  const map = new Map<number, number>();
  for (const r of rows) if (r.producto_id != null) map.set(r.producto_id, Number(r._sum.stock ?? 0));
  return map;
}
