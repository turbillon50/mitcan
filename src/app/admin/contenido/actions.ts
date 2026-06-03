"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function setBlock(key: string, content: unknown) {
  const existing = await prisma.content_blocks.findUnique({ where: { key } });
  if (existing) {
    await prisma.content_blocks.update({
      where: { key },
      data: { content: content as object, updated_at: new Date() },
    });
  } else {
    await prisma.content_blocks.create({ data: { key, content: content as object } });
  }
}

export async function saveHero(formData: FormData) {
  await requireAdmin();
  const hero = {
    titulo: (formData.get("titulo") as string)?.trim() || "",
    subtitulo: (formData.get("subtitulo") as string)?.trim() || "",
    cta_text: (formData.get("cta_text") as string)?.trim() || "",
    cta_href: (formData.get("cta_href") as string)?.trim() || "",
  };
  await setBlock("hero", hero);
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export type Banner = { imagen_url: string; activo: boolean; href?: string };

export async function saveBanners(banners: Banner[]) {
  await requireAdmin();
  await setBlock("banners", banners);
  revalidatePath("/admin/contenido");
  revalidatePath("/");
  return { ok: true };
}
