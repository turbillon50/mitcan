"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCanvasDefaults,
  mergeBrand,
  mergeHero,
  mergeSections,
  mergeVideo,
  normalizeCarousels,
  type BrandContent,
  type CarouselItem,
  type HeroContent,
  type SectionsContent,
  type VideoContent,
} from "@/lib/brand-content";

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

function revalidateCanvas() {
  revalidatePath("/");
  revalidatePath("/admin/canvas");
  revalidatePath("/admin/contenido");
}

export async function saveHero(formData: FormData) {
  await requireAdmin();
  const existing = await prisma.content_blocks.findUnique({ where: { key: "hero" } });
  const previous = mergeHero(existing?.content);
  const hero = {
    ...previous,
    titulo: (formData.get("titulo") as string)?.trim() || "",
    subtitulo: (formData.get("subtitulo") as string)?.trim() || "",
    cta_text: (formData.get("cta_text") as string)?.trim() || "",
    cta_href: (formData.get("cta_href") as string)?.trim() || "",
  };
  await setBlock("hero", mergeHero(hero));
  revalidateCanvas();
}

export async function saveBrandCanvas(brand: BrandContent) {
  await requireAdmin();
  await setBlock("brand", mergeBrand(brand));
  revalidateCanvas();
  return { ok: true };
}

export async function saveHeroCanvas(hero: HeroContent) {
  await requireAdmin();
  await setBlock("hero", mergeHero(hero));
  revalidateCanvas();
  return { ok: true };
}

export async function saveCarouselsCanvas(carousels: CarouselItem[]) {
  await requireAdmin();
  await setBlock("carousels", normalizeCarousels(carousels));
  revalidateCanvas();
  return { ok: true };
}

export async function saveVideoCanvas(video: VideoContent) {
  await requireAdmin();
  await setBlock("video", mergeVideo(video));
  revalidateCanvas();
  return { ok: true };
}

export async function saveSectionsCanvas(sections: SectionsContent) {
  await requireAdmin();
  await setBlock("sections", mergeSections(sections));
  revalidateCanvas();
  return { ok: true };
}

export async function resetCanvasDefaults() {
  await requireAdmin();
  const defaults = getCanvasDefaults();
  await Promise.all([
    setBlock("brand", defaults.brand),
    setBlock("hero", defaults.hero),
    setBlock("carousels", defaults.carousels),
    setBlock("video", defaults.video),
    setBlock("sections", defaults.sections),
  ]);
  revalidateCanvas();
  return defaults;
}

export type Banner = { imagen_url: string; activo: boolean; href?: string };

export async function saveBanners(banners: Banner[]) {
  await requireAdmin();
  await setBlock("banners", banners);
  revalidateCanvas();
  return { ok: true };
}
