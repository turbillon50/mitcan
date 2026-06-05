"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function completarOnboarding(formData: FormData) {
  const user = await requireUser();
  const nombre = (formData.get("nombre") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const sucursalRaw = (formData.get("sucursal_id") as string) || "";
  const sucursal_id = sucursalRaw ? Number(sucursalRaw) : null;

  await prisma.users.update({
    where: { id: user.id },
    data: {
      ...(nombre ? { nombre } : {}),
      telefono,
      ...(sucursal_id ? { sucursal_id } : {}),
    },
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/perfil");
  redirect("/app/dashboard");
}
