export type BrandColors = {
  primary: string;
  primaryDark: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
};

export type BrandContent = {
  appName: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  colors: BrandColors;
};

export type HeroContent = {
  titulo: string;
  subtitulo: string;
  cta_text: string;
  cta_href: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl: string;
};

export type CarouselItem = {
  id: string;
  image: string;
  caption: string;
  link: string;
};

export type VideoContent = {
  url: string;
  poster: string;
  titulo: string;
};

export type SectionsContent = {
  showHero: boolean;
  showCarousel: boolean;
  showVideo: boolean;
  showCategorias: boolean;
  showPromos: boolean;
  showSucursales: boolean;
};

export const DEFAULT_BRAND: BrandContent = {
  appName: "CSN",
  tagline: "Carnes Selectas Nayarit",
  logoUrl: "/assets/logo-badge.png",
  iconUrl: "/icons/favicon.svg",
  colors: {
    primary: "#C41E3A",
    primaryDark: "#A8172E",
    bg: "#F5F0E8",
    surface: "#FFFFFF",
    text: "#1A1A1A",
    muted: "#6B5E54",
    accent: "#A8172E",
  },
};

export const DEFAULT_HERO: HeroContent = {
  titulo: "La carne mas selecta de Nayarit, con premios en cada compra.",
  subtitulo:
    "Cortes premium, sucursales cerca de ti y un club que te regresa puntos por cada kilo.",
  cta_text: "Crear cuenta",
  cta_href: "/sign-up",
  mediaType: "image",
  mediaUrl: "/assets/logo-hero.png",
  posterUrl: "",
};

export const DEFAULT_VIDEO: VideoContent = {
  url: "",
  poster: "",
  titulo: "Conoce la experiencia",
};

export const DEFAULT_SECTIONS: SectionsContent = {
  showHero: true,
  showCarousel: true,
  showVideo: true,
  showCategorias: true,
  showPromos: true,
  showSucursales: true,
};

export const DEFAULT_CAROUSELS: CarouselItem[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function hex(value: unknown, fallback: string) {
  const raw = text(value);
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    return `#${withHash
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase()}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  return fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function mergeBrand(input: unknown): BrandContent {
  if (!isRecord(input)) return DEFAULT_BRAND;
  const colors = isRecord(input.colors) ? input.colors : {};
  return {
    appName: text(input.appName, DEFAULT_BRAND.appName) || DEFAULT_BRAND.appName,
    tagline: text(input.tagline, DEFAULT_BRAND.tagline) || DEFAULT_BRAND.tagline,
    logoUrl: text(input.logoUrl, DEFAULT_BRAND.logoUrl) || DEFAULT_BRAND.logoUrl,
    iconUrl: text(input.iconUrl, DEFAULT_BRAND.iconUrl) || DEFAULT_BRAND.iconUrl,
    colors: {
      primary: hex(colors.primary, DEFAULT_BRAND.colors.primary),
      primaryDark: hex(colors.primaryDark, DEFAULT_BRAND.colors.primaryDark),
      bg: hex(colors.bg, DEFAULT_BRAND.colors.bg),
      surface: hex(colors.surface, DEFAULT_BRAND.colors.surface),
      text: hex(colors.text, DEFAULT_BRAND.colors.text),
      muted: hex(colors.muted, DEFAULT_BRAND.colors.muted),
      accent: hex(colors.accent, DEFAULT_BRAND.colors.accent),
    },
  };
}

export function mergeHero(input: unknown): HeroContent {
  if (!isRecord(input)) return DEFAULT_HERO;
  const mediaType = input.mediaType === "video" ? "video" : "image";
  return {
    titulo: text(input.titulo, DEFAULT_HERO.titulo) || DEFAULT_HERO.titulo,
    subtitulo: text(input.subtitulo, DEFAULT_HERO.subtitulo) || DEFAULT_HERO.subtitulo,
    cta_text: text(input.cta_text, DEFAULT_HERO.cta_text) || DEFAULT_HERO.cta_text,
    cta_href: text(input.cta_href, DEFAULT_HERO.cta_href) || DEFAULT_HERO.cta_href,
    mediaType,
    mediaUrl: text(input.mediaUrl, DEFAULT_HERO.mediaUrl),
    posterUrl: text(input.posterUrl, DEFAULT_HERO.posterUrl),
  };
}

export function normalizeCarousels(input: unknown): CarouselItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const id = text(item.id, `slide-${index + 1}`) || `slide-${index + 1}`;
      return {
        id,
        image: text(item.image),
        caption: text(item.caption),
        link: text(item.link),
      };
    })
    .filter((item): item is CarouselItem => Boolean(item?.image));
}

export function bannersToCarousels(input: unknown): CarouselItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item, index) => {
      if (!isRecord(item) || item.activo === false) return null;
      const image = text(item.imagen_url);
      if (!image) return null;
      return {
        id: `banner-${index + 1}`,
        image,
        caption: "",
        link: text(item.href),
      };
    })
    .filter((item): item is CarouselItem => Boolean(item));
}

export function mergeVideo(input: unknown): VideoContent {
  if (!isRecord(input)) return DEFAULT_VIDEO;
  return {
    url: text(input.url),
    poster: text(input.poster),
    titulo: text(input.titulo, DEFAULT_VIDEO.titulo) || DEFAULT_VIDEO.titulo,
  };
}

export function mergeSections(input: unknown): SectionsContent {
  if (!isRecord(input)) return DEFAULT_SECTIONS;
  return {
    showHero: bool(input.showHero, DEFAULT_SECTIONS.showHero),
    showCarousel: bool(input.showCarousel, DEFAULT_SECTIONS.showCarousel),
    showVideo: bool(input.showVideo, DEFAULT_SECTIONS.showVideo),
    showCategorias: bool(input.showCategorias, DEFAULT_SECTIONS.showCategorias),
    showPromos: bool(input.showPromos, DEFAULT_SECTIONS.showPromos),
    showSucursales: bool(input.showSucursales, DEFAULT_SECTIONS.showSucursales),
  };
}

export function hexToRgbTriplet(value: string) {
  const normalized = hex(value, "#000000").slice(1);
  const int = Number.parseInt(normalized, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

export function buildBrandCss(brand: BrandContent) {
  const c = brand.colors;
  return `:root{--brand-primary:${c.primary};--brand-primary-dark:${c.primaryDark};--brand-bg:${c.bg};--brand-surface:${c.surface};--brand-text:${c.text};--brand-muted:${c.muted};--brand-accent:${c.accent};--primary:${hexToRgbTriplet(c.primary)};--primary-dark:${hexToRgbTriplet(c.primaryDark)};--accent:${hexToRgbTriplet(c.accent)};--bg:${hexToRgbTriplet(c.bg)};--surface:${hexToRgbTriplet(c.surface)};--on-bg:${hexToRgbTriplet(c.text)};--on-bg-muted:${hexToRgbTriplet(c.muted)};}html.dark{--brand-primary:${c.primary};--brand-primary-dark:${c.primaryDark};--brand-accent:${c.accent};--primary:${hexToRgbTriplet(c.primary)};--primary-dark:${hexToRgbTriplet(c.primaryDark)};--accent:${hexToRgbTriplet(c.accent)};}`;
}

export type CanvasDefaults = {
  brand: BrandContent;
  hero: HeroContent;
  carousels: CarouselItem[];
  video: VideoContent;
  sections: SectionsContent;
};

export function getCanvasDefaults(): CanvasDefaults {
  return {
    brand: mergeBrand(null),
    hero: mergeHero(null),
    carousels: [...DEFAULT_CAROUSELS],
    video: mergeVideo(null),
    sections: mergeSections(null),
  };
}
