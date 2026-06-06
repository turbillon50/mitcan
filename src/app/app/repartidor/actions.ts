"use server";

import { revalidatePath } from "next/cache";
import { requireRepartidor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarEvento, acreditarPuntos } from "@/lib/online";

/** Estados que el repartidor puede fijar y su orden de avance. */
const RIDER_ESTADOS = ["en_camino", "ha_llegado"] as const;
type RiderEstado = (typeof RIDER_ESTADOS)[number];

/** Avanza el estado de un pedido asignado al repartidor que lo ejecuta. */
export async function repartidorAvanzar(pedidoId: number, estado: RiderEstado) {
  const user = await requireRepartidor();
  if (!RIDER_ESTADOS.includes(estado)) throw new Error("Estado inválido");

  const pedido = await prisma.pedidos.findUnique({ where: { id: pedidoId } });
  if (!pedido) throw new Error("Pedido no encontrado");

  // Un repartidor solo toca SUS pedidos (staff/admin pueden supervisar).
  const esStaff = user.rol === "admin" || user.rol === "gerente" || user.rol === "empleado";
  if (!esStaff && pedido.repartidor_id !== user.id) {
    throw new Error("Este pedido no está asignado a ti");
  }

  const entrega = estado === "ha_llegado";
  const actualizado = await prisma.pedidos.update({
    where: { id: pedidoId },
    data: {
      estado,
      ...(entrega
        ? { entregado_at: new Date(), entrega_confirmada: true }
        : {}),
    },
  });

  await registrarEvento(pedidoId, estado, {
    userId: actualizado.user_id,
    folio: actualizado.folio,
  }).catch(() => null);

  if (entrega) {
    await acreditarPuntos({
      id: actualizado.id,
      user_id: actualizado.user_id,
      folio: actualizado.folio,
      puntos_ganados: actualizado.puntos_ganados,
    }).catch(() => null);
  }

  revalidatePath("/app/repartidor");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}
