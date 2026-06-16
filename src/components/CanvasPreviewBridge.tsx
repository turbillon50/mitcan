"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  buildBrandCss,
  hexToRgbTriplet,
  type BrandContent,
  type CarouselItem,
  type HeroContent,
  type SectionsContent,
  type VideoContent,
} from "@/lib/brand-content";

export type CanvasDraft = {
  brand?: BrandContent;
  hero?: HeroContent;
  carousels?: CarouselItem[];
  video?: VideoContent;
  sections?: SectionsContent;
};

const STYLE_ID = "canvas-preview-vars";
const TARGET_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

function isSameOrigin(event: MessageEvent) {
  return event.origin === TARGET_ORIGIN;
}

function applyColors(brand?: BrandContent) {
  if (!brand?.colors || typeof document === "undefined") return;
  const c = brand.colors;
  const root = document.documentElement;
  const vars: Array<[string, string]> = [
    ["--brand-primary", c.primary],
    ["--brand-primary-dark", c.primaryDark],
    ["--brand-bg", c.bg],
    ["--brand-surface", c.surface],
    ["--brand-text", c.text],
    ["--brand-muted", c.muted],
    ["--brand-accent", c.accent],
    ["--primary", hexToRgbTriplet(c.primary)],
    ["--primary-dark", hexToRgbTriplet(c.primaryDark)],
    ["--accent", hexToRgbTriplet(c.accent)],
    ["--bg", hexToRgbTriplet(c.bg)],
    ["--surface", hexToRgbTriplet(c.surface)],
    ["--on-bg", hexToRgbTriplet(c.text)],
    ["--on-bg-muted", hexToRgbTriplet(c.muted)],
  ];
  vars.forEach(([name, value]) => root.style.setProperty(name, value));

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = buildBrandCss(brand);
}

function patchBrandDOM(brand?: BrandContent) {
  if (!brand || typeof document === "undefined") return;
  document.querySelectorAll<HTMLImageElement>('[data-preview="logo"]').forEach((img) => {
    if (brand.logoUrl) img.src = brand.logoUrl;
  });
  document.querySelectorAll<HTMLElement>('[data-preview="appname"], [data-preview="appname-footer"]').forEach((el) => {
    el.textContent = brand.appName;
  });
  document.querySelectorAll<HTMLElement>('[data-preview="tagline"], [data-preview="tagline-footer"]').forEach((el) => {
    el.textContent = brand.tagline;
  });
  document.querySelectorAll<HTMLElement>('[data-preview="carousel-appname"]').forEach((el) => {
    el.textContent = brand.appName;
  });
}

function patchHeroMedia(section: HTMLElement, hero: HeroContent) {
  const existing = section.querySelector<HTMLElement>('[data-preview="hero-media"]');
  if (hero.mediaType === "video" && hero.mediaUrl) {
    if (existing?.tagName === "VIDEO") {
      const vid = existing as HTMLVideoElement;
      vid.src = hero.mediaUrl;
      if (hero.posterUrl) vid.poster = hero.posterUrl;
      return;
    }
    existing?.remove();
    const vid = document.createElement("video");
    vid.setAttribute("data-preview", "hero-media");
    vid.src = hero.mediaUrl;
    if (hero.posterUrl) vid.poster = hero.posterUrl;
    vid.autoplay = true;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.className = "absolute inset-0 h-full w-full object-cover";
    section.insertBefore(vid, section.firstChild);
    return;
  }
  if (hero.mediaUrl) {
    if (existing?.tagName === "IMG") {
      (existing as HTMLImageElement).src = hero.mediaUrl;
      return;
    }
    existing?.remove();
    const img = document.createElement("img");
    img.setAttribute("data-preview", "hero-media");
    img.src = hero.mediaUrl;
    img.alt = "";
    img.className = "absolute inset-0 h-full w-full object-cover";
    section.insertBefore(img, section.firstChild);
  }
}

function patchHeroDOM(hero?: HeroContent) {
  if (!hero || typeof document === "undefined") return;
  const section = document.querySelector<HTMLElement>('[data-preview-section="hero"]');
  if (!section) return;

  const title = section.querySelector<HTMLElement>('[data-preview="hero-title"]');
  if (title) title.textContent = hero.titulo || "";
  const sub = section.querySelector<HTMLElement>('[data-preview="hero-subtitle"]');
  if (sub) sub.textContent = hero.subtitulo || "";
  const cta = section.querySelector<HTMLElement>('[data-preview="hero-cta-text"]');
  if (cta) cta.textContent = hero.cta_text || "Crear cuenta";
  const ctaLink = section.querySelector<HTMLAnchorElement>('[data-preview="hero-cta-link"]');
  if (ctaLink && hero.cta_href) ctaLink.href = hero.cta_href;

  patchHeroMedia(section, hero);
}

function buildSlideElement(item: CarouselItem, index: number) {
  const el = document.createElement(item.link ? "a" : "div");
  el.setAttribute("data-preview-slide", String(index));
  el.className =
    "group relative h-72 w-[82vw] max-w-[520px] shrink-0 snap-start overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card sm:w-[480px]";
  if (item.link && el instanceof HTMLAnchorElement) {
    el.href = item.link.startsWith("http") ? item.link : item.link;
  }

  const img = document.createElement("img");
  img.src = item.image || "";
  img.alt = item.caption || "Destacado";
  img.className = "h-full w-full object-cover transition duration-500 group-hover:scale-105";

  const overlay = document.createElement("div");
  overlay.className = "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent";

  el.appendChild(img);
  el.appendChild(overlay);

  if (item.caption) {
    const cap = document.createElement("p");
    cap.setAttribute("data-preview", "slide-caption");
    cap.className =
      "absolute inset-x-0 bottom-0 p-5 font-display text-2xl font-bold leading-tight text-white";
    cap.textContent = item.caption;
    el.appendChild(cap);
  }

  return el;
}

function patchCarouselsDOM(carousels?: CarouselItem[]) {
  if (!Array.isArray(carousels) || typeof document === "undefined") return;
  const track = document.querySelector<HTMLElement>('[data-preview="carousel-track"]');
  if (!track) return;

  const slides = carousels.filter((item) => item.image);
  track.replaceChildren(...slides.map((item, index) => buildSlideElement(item, index)));
}

function getVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return url;
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}

function patchVideoDOM(video?: VideoContent) {
  if (!video || typeof document === "undefined") return;
  const section = document.querySelector<HTMLElement>('[data-preview-section="video"]');
  if (!section) return;

  const title = section.querySelector<HTMLElement>('[data-preview="video-title"]');
  if (title) title.textContent = video.titulo || "";

  const mediaHost = section.querySelector<HTMLElement>('[data-preview="video-media"]');
  if (!mediaHost) return;

  if (!video.url) {
    mediaHost.replaceChildren();
    return;
  }

  const embedUrl = getVideoEmbedUrl(video.url);
  if (embedUrl) {
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.title = video.titulo || "Video";
    iframe.className = "aspect-video w-full";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    mediaHost.replaceChildren(iframe);
    return;
  }

  const vid = document.createElement("video");
  vid.src = video.url;
  if (video.poster) vid.poster = video.poster;
  vid.controls = true;
  vid.className = "aspect-video w-full bg-black";
  mediaHost.replaceChildren(vid);
}

function patchSectionsVisibility(sections?: SectionsContent) {
  if (!sections || typeof document === "undefined") return;
  const map: Array<[string, keyof SectionsContent]> = [
    ["hero", "showHero"],
    ["carousel", "showCarousel"],
    ["video", "showVideo"],
    ["categorias", "showCategorias"],
    ["promos", "showPromos"],
    ["sucursales", "showSucursales"],
  ];
  map.forEach(([name, key]) => {
    const el = document.querySelector<HTMLElement>(`[data-preview-section="${name}"]`);
    if (el) el.style.display = sections[key] ? "" : "none";
  });
}

export function applyCanvasDraft(draft: CanvasDraft) {
  if (!draft || typeof document === "undefined") return;
  applyColors(draft.brand);
  patchSectionsVisibility(draft.sections);
  patchBrandDOM(draft.brand);
  patchHeroDOM(draft.hero);
  patchCarouselsDOM(draft.carousels);
  patchVideoDOM(draft.video);
  (window as Window & { __CSN_CANVAS_DRAFT?: CanvasDraft }).__CSN_CANVAS_DRAFT = draft;
}

function announceReady() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "canvas-ready" }, TARGET_ORIGIN);
    }
  } catch {}
}

export default function CanvasPreviewBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onMessage(event: MessageEvent) {
      if (!isSameOrigin(event)) return;
      const data = event.data;
      if (data?.type === "canvas-draft") {
        applyCanvasDraft(data.draft as CanvasDraft);
      }
    }

    window.addEventListener("message", onMessage);

    const existing = (window as Window & { __CSN_CANVAS_DRAFT?: CanvasDraft }).__CSN_CANVAS_DRAFT;
    if (existing) applyCanvasDraft(existing);

    announceReady();

    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    announceReady();
  }, [pathname]);

  return null;
}