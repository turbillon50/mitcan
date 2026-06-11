import Link from "next/link";
import { MapPin, Gift, QrCode, ArrowRight, Flame, Beef } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import BottomNav from "@/components/BottomNav";
import PromoCarousel from "@/components/PromoCarousel";
import ProductGrid from "@/components/ProductGrid";
import SucursalesMap from "@/components/SucursalesMap";
import { FadeInOnScroll, SlideIn } from "@/components/motion";
import {
  getProductosConCategoria,
  getSucursales,
  getPromocionesActivas,
  getContent,
} from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";
import { serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

type Hero = { titulo?: string; subtitulo?: string; cta_text?: string; cta_href?: string };

export default async function LandingPage() {
  const [productos, sucursales, promos, hero] = await Promise.all([
    getProductosConCategoria({ soloActivos: true }),
    getSucursales({ soloActivas: true }),
    getPromocionesActivas(12),
    getContent<Hero>("hero"),
  ]);
  const token = getMapboxToken();

  const showcase = serialize(
    productos.slice(0, 8).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      unidad: p.unidad,
      imagen_url: p.imagen_url,
      categoria: p.categoria?.nombre ?? null,
      es_nuevo: p.es_nuevo ?? false,
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

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <PublicHeader />

      {/* Hero */}
      <section className="csn-gradient relative overflow-hidden border-b border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <SlideIn from="left" className="max-w-2xl">
            <span className="chip chip-active mb-5">
              <Flame size={14} /> Club de recompensas CSN
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              {hero?.titulo ?? (
                <>
                  La carne más selecta de <span className="text-primary">Nayarit</span>, con premios en cada compra.
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-on-bg-muted">
              {hero?.subtitulo ??
                `Cortes premium, ${sucursales.length} sucursales en Nayarit, Sinaloa y Jalisco, y un club que te regresa puntos por cada kilo.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero?.cta_href || "/sign-up"} className="btn-primary px-5 py-3 text-base">
                {hero?.cta_text || "Únete gratis"} <ArrowRight size={18} />
              </Link>
              <Link href="/pedido" className="btn-ghost px-5 py-3 text-base">
                🛒 Pedido en línea
              </Link>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* PEDIDO EN LÍNEA */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="card flex flex-col items-start gap-4 overflow-hidden p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <span className="chip chip-active mb-3">🛵 Nuevo</span>
            <h2 className="section-title text-2xl md:text-3xl">Pedido en línea</h2>
            <p className="mt-2 max-w-xl text-on-bg-muted">
              Arma tu carrito por categorías, paga contra entrega y recíbelo en tu
              domicilio en Tepic por solo $25 de envío. Acumula puntos en cada compra.
            </p>
          </div>
          <Link href="/pedido" className="btn-primary shrink-0 px-6 py-3.5 text-base">
            Pedir ahora <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Promos */}
      {promosData.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-12">
          <FadeInOnScroll>
            <h2 className="section-title mb-6 flex items-center gap-2">
              <Flame className="text-primary" size={22} /> Promociones de temporada
            </h2>
          </FadeInOnScroll>
          <PromoCarousel promos={promosData} />
        </section>
      )}

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: QrCode, title: "Escanea en caja", body: "Suma puntos en cada compra con tu QR de membresía." },
            { icon: Gift, title: "Canjea recompensas", body: "Cupones, descuentos y envíos gratis con tus puntos." },
            { icon: Beef, title: "Cortes selectos", body: "Ribeye, arrachera, picaña y combos parrilleros." },
          ].map(({ icon: Icon, title, body }, i) => (
            <FadeInOnScroll key={title} delay={i * 0.08}>
              <div className="card h-full p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-on-bg-muted">{body}</p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {/* Products */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <FadeInOnScroll>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="section-title">Cortes destacados 🔥</h2>
              <Link href="/catalogo" className="text-sm font-semibold text-primary">Ver todo</Link>
            </div>
          </FadeInOnScroll>
          <ProductGrid productos={showcase} />
        </section>
      )}

      {/* Sucursales + mapa */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <FadeInOnScroll>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title flex items-center gap-2">
              <MapPin className="text-primary" size={22} /> {sucursales.length} sucursales
            </h2>
            <Link href="/sucursales" className="text-sm font-semibold text-primary">Ver todas</Link>
          </div>
        </FadeInOnScroll>
        {token && puntos.length > 0 ? (
          <SucursalesMap token={token} puntos={puntos} />
        ) : (
          <div className="csn-gradient flex flex-col items-center gap-4 rounded-3xl border border-hairline p-10 text-center">
            <MapPin className="text-primary" size={28} />
            <p className="max-w-md text-on-bg-muted">
              Tepic, Mazatlán, Vallarta, Bahía de Banderas y foráneas de Nayarit.
            </p>
            <Link href="/sucursales" className="btn-primary px-5 py-3">
              Ver sucursales <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      <footer id="contacto" className="border-t border-hairline bg-surface-2/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="font-display text-lg font-bold">Carnes Selectas Nayarit</h3>
            <p className="mt-2 text-sm text-on-bg-muted">
              Cortes selectos y club de recompensas, con sucursales en Nayarit, Sinaloa y Jalisco.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Explora</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/catalogo" className="hover:text-primary">Catálogo por categorías</Link></li>
              <li><Link href="/pedido" className="hover:text-primary">Pedido en línea</Link></li>
              <li><Link href="/sucursales" className="hover:text-primary">Sucursales</Link></li>
              <li><Link href="/sign-up" className="hover:text-primary">Únete al club</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Contacto</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/sucursales" className="hover:text-primary">Teléfono y WhatsApp por sucursal</Link></li>
              <li><a href="https://carnesn.ink" className="hover:text-primary">carnesn.ink</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-on-bg-muted">
              <li><Link href="/legal#privacidad" className="hover:text-primary">Aviso de Privacidad</Link></li>
              <li><Link href="/legal#terminos" className="hover:text-primary">Términos y Condiciones</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-hairline py-6 text-center text-sm text-on-bg-muted">
          © {new Date().getFullYear()} CSN — Carnes Selectas Nayarit
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
