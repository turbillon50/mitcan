"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function canjearRecompensa(recompensaId: number) {
  const user = await requireUser();

  const recompensa = await prisma.recompensas.findUnique({
    where: { id: recompensaId },
  });
  if (!recompensa || !recompensa.activa) {
    return { ok: false, error: "Recompensa no disponible." };
  }
  if ((user.puntos ?? 0) < recompensa.puntos_requeridos) {
    return { ok: false, error: "No tienes puntos suficientes." };
  }

  await prisma.$transaction([
    prisma.redenciones.create({
      data: {
        user_id: user.id,
        recompensa_id: recompensa.id,
        estado: "activa",
      },
    }),
    prisma.users.update({
      where: { id: user.id },
      data: { puntos: { decrement: recompensa.puntos_requeridos } },
    }),
  ]);

  revalidatePath("/app/recompensas");
  revalidatePath("/app/dashboard");
  return { ok: true };
}
