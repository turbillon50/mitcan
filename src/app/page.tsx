import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import BottomNav from "@/components/BottomNav";
import PromoCarousel from "@/components/PromoCarousel";
import CategoryAreasGrid from "@/components/CategoryAreasGrid";
import SucursalesMap from "@/components/SucursalesMap";
import { FadeInOnScroll, SlideIn } from "@/components/motion";
import {
  IconArrowRight,
  IconBeef,
  IconFlame,
  IconGift,
  IconMapPin,
  IconQrCode,
  IconShoppingCart,
} from "@/components/icons";
import {
  getCategoriasConConteoProductos,
  getSucursales,
  getPromocionesActivas,
  getContent,
} from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";
import { serialize } from "@/lib/format";
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

export const dynamic = "force-dynamic";

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function SmartLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (!href) return <div className={className}>{children}</div>;
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
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

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const isCanvasPreview = Boolean(sp?.canvasPreview);
  const { userId } = await auth();
  if (userId && !isCanvasPreview) redirect("/app");

  const [
    categorias,
    sucursales,
    promos,
    brandRaw,
    heroRaw,
    carouselsRaw,
    legacyBannersRaw,
    videoRaw,
    sectionsRaw,
  ] = await Promise.all([
    getCategoriasConConteoProductos({ soloActivas: true, soloProductosActivos: true }),
    getSucursales({ soloActivas: true }),
    getPromocionesActivas(12),
    getContent<BrandContent>("brand"),
    getContent<HeroContent>("hero"),
    getContent<CarouselItem[]>("carousels"),
    getContent("banners"),
    getContent<VideoContent>("video"),
    getContent<SectionsContent>("sections"),
  ]);

  const brand = mergeBrand(brandRaw);
  const hero = mergeHero(heroRaw);
  const video = mergeVideo(videoRaw);
  const sections = mergeSections(sectionsRaw);
  const carouselItems = normalizeCarousels(carouselsRaw);
  const carousels = carouselItems.length > 0 ? carouselItems : bannersToCarousels(legacyBannersRaw);
  const token = getMapboxToken();

  const categoryAreas = serialize(
    categorias.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      icono: c.icono,
      productos_count: c.productos_count,
    }))
  );

  const promosData = serialize(
    promos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion,
      imagen_url: p.imagen_url,
      precio_promo: p.precio_promo != null ? Number(p.precio_promo) : null,
      unidad: p.unidad,
      todas: (p.sucursales ?? []).includes("todas"),
    }))
  );

  const puntos = sucursales
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({
      id: s.id,
      nombre: s.nombre,
      area: s.area,
      direccion: s.direccion,
      telefono: s.telefono,
      lat: Number(s.lat),
      lng: Number(s.lng),
    }));

  const productosVisibles = categoryAreas.reduce(
    (total, categoria) => total + (categoria.productos_count ?? 0),
    0
  );
  const videoEmbedUrl = video.url ? getVideoEmbedUrl(video.url) : null;

  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <PublicHeader />

      {sections.showHero || isCanvasPreview ? (
        <section data-preview-section="hero" className="relative isolate min-h-[68dvh] overflow-hidden border-b border-hairline bg-surface">
          {hero.mediaType === "video" && hero.mediaUrl ? (
            <video
              data-preview="hero-media"
              src={hero.mediaUrl}
              poster={hero.posterUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : hero.mediaUrl ? (
            <img data-preview="hero-media" src={hero.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div data-preview="hero-media" className="csn-gradient absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent" />

          <div className="relative mx-auto flex min-h-[68dvh] max-w-6xl items-center px-5 py-14">
            <SlideIn from="left" className="max-w-3xl text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur">
                <IconFlame size={14} /> Club de recompensas
              </span>
              <h1 data-preview="hero-title" className="mt-5 font-display text-4xl font-extrabold leading-[1.02] md:text-6xl lg:text-7xl">
                {hero.titulo}
              </h1>
              <p data-preview="hero-subtitle" className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80 md:text-xl">
                {hero.subtitulo}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link data-preview="hero-cta-link" href={hero.cta_href || "/sign-up"} className="btn-primary px-6 py-3.5 text-base">
                  <span data-preview="hero-cta-text">{hero.cta_text || "Crear cuenta"}</span> <IconArrowRight size={18} />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/[0.12] px-6 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Ya tengo cuenta
                </Link>
              </div>
              <dl className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  { label: "Productos", value: productosVisibles },
                  { label: "Sucursales", value: sucursales.length },
                  { label: "Promos", value: promosData.length },
                ].map((item) => (
                  <div key={item.label} className="border-l border-white/25 pl-3">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-white/60">{item.label}</dt>
                    <dd className="font-display text-2xl font-extrabold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </SlideIn>
          </div>
        </section>
      ) : null}

      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Onboarding</p>
            <h2 className="section-title mt-2 text-2xl md:text-3xl">Registra tu cuenta y compra con beneficios desde el primer pedido.</h2>
          </div>
          <Link href="/pedido" className="btn-ghost w-fit px-5 py-3 text-base">
            <IconShoppingCart size={18} /> Pedido en linea
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: IconQrCode, title: "Escanea en caja", body: "Suma puntos con tu QR de membresia." },
            { icon: IconGift, title: "Canjea recompensas", body: "Convierte puntos en beneficios dentro del club." },
            { icon: IconBeef, title: "Compra cortes selectos", body: "Explora areas, productos y promociones activas." },
          ].map(({ icon: Icon, title, body }, i) => (
            <FadeInOnScroll key={title} delay={i * 0.08}>
              <article className="card h-full p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold">{title}</h3>
                <p className="mt-1 text-sm text-on-bg-muted">{body}</p>
              </article>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {(sections.showCarousel && carousels.length > 0) || isCanvasPreview ? (
        <section data-preview-section="carousel" className="mx-auto max-w-6xl px-5 py-10">
          <FadeInOnScroll>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Destacados</p>
                <h2 className="section-title mt-1">
                  Lo que esta pasando en <span data-preview="carousel-appname">{brand.appName}</span>
                </h2>
              </div>
            </div>
          </FadeInOnScroll>
          <div
            data-preview="carousel-track"
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2"
          >
            {carousels.map((item, index) => (
              <SmartLink
                key={item.id}
                href={item.link}
                data-preview-slide={index}
                className="group relative h-72 w-[82vw] max-w-[520px] shrink-0 snap-start overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card sm:w-[480px]"
              >
                <img src={item.image} alt={item.caption || "Destacado"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {item.caption ? (
                  <p data-preview="slide-caption" className="absolute inset-x-0 bottom-0 p-5 font-display text-2xl font-bold leading-tight text-white">
                    {item.caption}
                  </p>
                ) : null}
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}

      {sections.showPromos && promosData.length > 0 ? (
        <section data-preview-section="promos" className="mx-auto max-w-6xl px-5 py-10">
          <FadeInOnScroll>
            <h2 className="section-title mb-6 flex items-center gap-2">
              <IconFlame className="text-primary" size={22} /> Promociones de temporada
            </h2>
          </FadeInOnScroll>
          <PromoCarousel promos={promosData} />
        </section>
      ) : null}

      {(sections.showVideo && video.url) || isCanvasPreview ? (
        <section data-preview-section="video" className="bg-surface py-12">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <FadeInOnScroll>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Video</p>
              <h2 data-preview="video-title" className="section-title mt-2 text-3xl">{video.titulo}</h2>
              <p className="mt-3 text-sm text-on-bg-muted">
                Mira el contenido destacado antes de crear tu cuenta o continuar al pedido.
              </p>
            </FadeInOnScroll>
            <div data-preview="video-media" className="overflow-hidden rounded-2xl border border-hairline bg-black shadow-card">
              {videoEmbedUrl ? (
                <iframe
                  src={videoEmbedUrl}
                  title={video.titulo}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : video.url ? (
                <video src={video.url} poster={video.poster || undefined} controls className="aspect-video w-full bg-black" />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {sections.showCategorias && categoryAreas.length > 0 ? (
        <section data-preview-section="categorias" className="mx-auto max-w-6xl px-5 py-12">
          <FadeInOnScroll>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Catalogo</p>
                <h2 className="section-title mt-1">Areas de categoria</h2>
                <p className="mt-2 max-w-2xl text-sm text-on-bg-muted">
                  Elige un area para ver sus productos disponibles.
                </p>
              </div>
              <Link href="/catalogo" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver catalogo <IconArrowRight size={16} />
              </Link>
            </div>
          </FadeInOnScroll>
          <CategoryAreasGrid categorias={categoryAreas} />
        </section>
      ) : null}

      {sections.showSucursales ? (
        <section data-preview-section="sucursales" className="mx-auto max-w-6xl px-5 py-12">
          <FadeInOnScroll>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="section-title flex items-center gap-2">
                <IconMapPin className="text-primary" size={22} /> {sucursales.length} sucursales
              </h2>
              <Link href="/sucursales" className="text-sm font-semibold text-primary">
                Ver todas
              </Link>
            </div>
          </FadeInOnScroll>
          {token && puntos.length > 0 ? (
            <SucursalesMap token={token} puntos={puntos} />
          ) : (
            <div className="csn-gradient flex flex-col items-center gap-4 rounded-2xl border border-hairline p-10 text-center">
              <IconMapPin className="text-primary" size={28} />
              <p className="max-w-md text-on-bg-muted">
                Consulta telefonos, horarios y rutas disponibles por sucursal.
              </p>
              <Link href="/sucursales" className="btn-primary px-5 py-3">
                Ver sucursales <IconArrowRight size={18} />
              </Link>
            </div>
          )}
        </section>
      ) : null}

      <footer id="contacto" className="border-t border-hairline bg-surface-2/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 data-preview="appname-footer" className="font-display text-lg font-bold">{brand.appName}</h3>
            <p data-preview="tagline-footer" className="mt-2 text-sm text-on-bg-muted">{brand.tagline}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Explora</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/catalogo" className="hover:text-primary">Catalogo por categorias</Link></li>
              <li><Link href="/pedido" className="hover:text-primary">Pedido en linea</Link></li>
              <li><Link href="/sucursales" className="hover:text-primary">Sucursales</Link></li>
              <li><Link href="/sign-up" className="hover:text-primary">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Cuenta</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/sign-in" className="hover:text-primary">Ya tengo cuenta</Link></li>
              <li><Link href="/app/recompensas" className="hover:text-primary">Recompensas</Link></li>
              <li><Link href="/app/dashboard" className="hover:text-primary">Mi panel</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/legal#privacidad" className="hover:text-primary">Aviso de Privacidad</Link></li>
              <li><Link href="/legal#terminos" className="hover:text-primary">Terminos y Condiciones</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-hairline py-6 text-center text-sm text-on-bg-muted">
          © {new Date().getFullYear()} {brand.appName}
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
