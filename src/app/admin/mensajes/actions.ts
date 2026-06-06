"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { enviarMensajeAdmin, marcarLeidos } from "@/lib/mensajes";

/** Administración responde a un cliente. */
export async function responderMensaje(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  const cuerpo = (formData.get("cuerpo") as string)?.trim();
  if (!cuerpo) return;
  await enviarMensajeAdmin(userId, cuerpo, admin.nombre ?? "CSN");
  revalidatePath(`/admin/mensajes/${userId}`);
  revalidatePath("/admin/mensajes");
}

/** Marca el hilo de un cliente como leído por la administración. */
export async function marcarHiloLeido(userId: string) {
  await requireAdmin();
  await marcarLeidos(userId, "admin");
  revalidatePath("/admin/mensajes");
}
