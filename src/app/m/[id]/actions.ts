"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDbUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Cashier action: add loyalty points to a member after a purchase. */
export async function sumarPuntos(userId: string, puntos: number) {
  const staff = await getCurrentDbUser();
  if (!staff || !isStaff(staff.rol)) {
    return { ok: false, error: "No autorizado" };
  }
  if (!Number.isFinite(puntos) || puntos <= 0) {
    return { ok: false, error: "Puntos inválidos" };
  }

  await prisma.users.update({
    where: { id: userId },
    data: { puntos: { increment: Math.round(puntos) } },
  });

  // Best-effort notification for the member.
  await prisma.notificaciones
    .create({
      data: {
        user_id: userId,
        titulo: "¡Sumaste puntos! 🥩",
        mensaje: `Ganaste ${Math.round(puntos)} puntos en tu última compra.`,
        tipo: "puntos",
      },
    })
    .catch(() => null);

  revalidatePath(`/m/${userId}`);
  return { ok: true };
}
