"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function actualizarPerfil(formData: FormData) {
  const user = await requireUser();
  const nombre = (formData.get("nombre") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;

  await prisma.users.update({
    where: { id: user.id },
    data: { nombre, telefono },
  });

  revalidatePath("/app/perfil");
  revalidatePath("/app/dashboard");
}
