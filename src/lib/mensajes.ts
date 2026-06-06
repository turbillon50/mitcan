import { prisma } from "./prisma";
import { ensureOnlineSchema } from "./online";
import { sendPushToUser } from "./push";

/** Centro de mensajes admin <-> cliente. Una conversación por cliente
 *  (mensajes.user_id = id del cliente). `remitente` = 'admin' | 'cliente'. */

export type Mensaje = {
  id: number;
  user_id: string;
  remitente: string;
  cuerpo: string;
  autor_nombre: string | null;
  leido_admin: boolean;
  leido_cliente: boolean;
  created_at: string;
};

/** Hilo completo de un cliente, en orden cronológico. */
export async function getThread(userId: string): Promise<Mensaje[]> {
  await ensureOnlineSchema();
  const rows = await prisma.mensajes.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    remitente: m.remitente,
    cuerpo: m.cuerpo,
    autor_nombre: m.autor_nombre ?? null,
    leido_admin: !!m.leido_admin,
    leido_cliente: !!m.leido_cliente,
    created_at: (m.created_at ?? new Date()).toISOString(),
  }));
}

/** Cliente envía un mensaje a la tienda; notifica a la administración. */
export async function enviarMensajeCliente(
  userId: string,
  cuerpo: string,
  autorNombre?: string | null
) {
  const texto = cuerpo.trim().slice(0, 2000);
  if (!texto) return null;
  await ensureOnlineSchema();
  const msg = await prisma.mensajes.create({
    data: {
      user_id: userId,
      remitente: "cliente",
      cuerpo: texto,
      autor_nombre: autorNombre ?? null,
      leido_cliente: true,
      leido_admin: false,
    },
  });

  // Avisar a la administración (bandeja + bell).
  const admins = await prisma.users.findMany({
    where: { rol: { in: ["admin", "gerente"] } },
    select: { id: true },
  });
  if (admins.length) {
    await prisma.notificaciones
      .createMany({
        data: admins.map((a) => ({
          user_id: a.id,
          titulo: "Nuevo mensaje de cliente 💬",
          mensaje: `${autorNombre ?? "Un cliente"}: ${texto.slice(0, 80)}`,
          tipo: "mensaje",
        })),
      })
      .catch(() => null);
    await Promise.allSettled(
      admins.map((a) =>
        sendPushToUser(a.id, {
          title: "Nuevo mensaje de cliente 💬",
          body: texto.slice(0, 120),
          url: `/admin/mensajes/${userId}`,
        })
      )
    );
  }
  return msg;
}

/** Administración responde al cliente; notifica + push al cliente. */
export async function enviarMensajeAdmin(
  userId: string,
  cuerpo: string,
  autorNombre?: string | null
) {
  const texto = cuerpo.trim().slice(0, 2000);
  if (!texto) return null;
  await ensureOnlineSchema();
  const msg = await prisma.mensajes.create({
    data: {
      user_id: userId,
      remitente: "admin",
      cuerpo: texto,
      autor_nombre: autorNombre ?? "CSN",
      leido_admin: true,
      leido_cliente: false,
    },
  });

  await prisma.notificaciones
    .create({
      data: {
        user_id: userId,
        titulo: "Mensaje de CSN 💬",
        mensaje: texto.slice(0, 140),
        tipo: "mensaje",
      },
    })
    .catch(() => null);
  await sendPushToUser(userId, {
    title: "Mensaje de CSN 💬",
    body: texto.slice(0, 120),
    url: "/app/mensajes",
  }).catch(() => null);

  return msg;
}

/** Marca como leídos los mensajes del otro lado del hilo. */
export async function marcarLeidos(userId: string, lado: "admin" | "cliente") {
  await ensureOnlineSchema();
  if (lado === "cliente") {
    // El cliente leyó los mensajes del admin.
    await prisma.mensajes.updateMany({
      where: { user_id: userId, remitente: "admin", leido_cliente: false },
      data: { leido_cliente: true },
    });
  } else {
    await prisma.mensajes.updateMany({
      where: { user_id: userId, remitente: "cliente", leido_admin: false },
      data: { leido_admin: true },
    });
  }
}

/** Nº de mensajes de clientes sin leer por la administración. */
export async function unreadAdminCount(): Promise<number> {
  await ensureOnlineSchema();
  return prisma.mensajes.count({
    where: { remitente: "cliente", leido_admin: false },
  });
}

/** Nº de mensajes del admin sin leer por un cliente. */
export async function unreadClienteCount(userId: string): Promise<number> {
  await ensureOnlineSchema();
  return prisma.mensajes.count({
    where: { user_id: userId, remitente: "admin", leido_cliente: false },
  });
}
