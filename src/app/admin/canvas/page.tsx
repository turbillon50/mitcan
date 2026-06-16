import { getContent } from "@/lib/data";
import {
  bannersToCarousels,
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
import CanvasEditor from "./CanvasEditor";

export const dynamic = "force-dynamic";

export type CanvasInitialData = {
  brand: BrandContent;
  hero: HeroContent;
  carousels: CarouselItem[];
  video: VideoContent;
  sections: SectionsContent;
};

export default async function AdminCanvasPage() {
  const [brand, hero, carousels, legacyBanners, video, sections] = await Promise.all([
    getContent<BrandContent>("brand"),
    getContent<HeroContent>("hero"),
    getContent<CarouselItem[]>("carousels"),
    getContent("banners"),
    getContent<VideoContent>("video"),
    getContent<SectionsContent>("sections"),
  ]);

  const slides = normalizeCarousels(carousels);

  const initial: CanvasInitialData = {
    brand: mergeBrand(brand),
    hero: mergeHero(hero),
    carousels: slides.length > 0 ? slides : bannersToCarousels(legacyBanners),
    video: mergeVideo(video),
    sections: mergeSections(sections),
  };

  return <CanvasEditor initial={initial} />;
}
