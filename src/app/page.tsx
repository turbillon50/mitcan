import Link from "next/link";
import Image from "next/image";
import { Beef, MapPin, Gift, QrCode, ArrowRight, Flame } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { getProductosConCategoria, getSucursales } from "@/lib/data";
import { formatMXN } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [productos, sucursales] = await Promise.all([
    getProductosConCategoria({ soloActivos: true }),
    getSucursales({ soloActivas: true }),
  ]);
  const destacados = productos.filter((p) => p.destacado).slice(0, 4);
  const showcase = (destacados.length ? destacados : productos).slice(0, 4);

  return (
    <div className="min-h-dvh">
      <PublicHeader />

      {/* Hero */}
      <section className="csn-gradient relative overflow-hidden border-b border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="max-w-2xl animate-fade-in">
            <span className="chip chip-active mb-5">
              <Flame size={14} /> Club de recompensas CSN
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              La carne más selecta de{" "}
              <span className="text-primary">Nayarit</span>, con premios en
              cada compra.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-on-bg-muted">
              Cortes premium, {sucursales.length || "varias"} sucursales en
              Nayarit, Sinaloa y Jalisco, y un club que te regresa puntos por
              cada kilo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-primary px-5 py-3 text-base">
                Únete gratis <ArrowRight size={18} />
              </Link>
              <Link href="/catalogo" className="btn-ghost px-5 py-3 text-base">
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: "Escanea en caja",
              body: "Suma puntos en cada compra con tu QR de membresía.",
            },
            {
              icon: Gift,
              title: "Canjea recompensas",
              body: "Cupones, descuentos y envíos gratis con tus puntos.",
            },
            {
              icon: Beef,
              title: "Cortes selectos",
              body: "Ribeye, New York, arrachera y combos parrilleros.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-on-bg-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="section-title">Cortes destacados 🔥</h2>
            <Link href="/catalogo" className="text-sm font-semibold text-primary">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {showcase.map((p) => (
              <article
                key={p.id}
                className="card overflow-hidden transition hover:border-primary/30"
              >
                <div className="relative h-36 bg-surface-2">
                  {p.imagen_url ? (
                    <Image
                      src={p.imagen_url}
                      alt={p.nombre}
                      fill
                      sizes="(max-width:768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/40">
                      <Beef size={40} />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-xs text-on-bg-muted">
                    {p.categoria?.nombre ?? "Producto"}
                  </p>
                  <h3 className="font-bold leading-tight">{p.nombre}</h3>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {formatMXN(Number(p.precio))}
                    <span className="text-on-bg-muted"> / {p.unidad ?? "kg"}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="csn-gradient flex flex-col items-center gap-5 rounded-3xl border border-hairline p-10 text-center">
          <MapPin className="text-primary" size={28} />
          <h2 className="font-display text-3xl font-bold">
            Encuentra tu carnicería CSN
          </h2>
          <p className="max-w-md text-on-bg-muted">
            {sucursales.length || "Múltiples"} sucursales en Tepic, Mazatlán,
            Vallarta, Bahía de Banderas y foráneas de Nayarit.
          </p>
          <Link href="/sucursales" className="btn-primary px-5 py-3">
            Ver sucursales <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-hairline py-8 text-center text-sm text-on-bg-muted">
        © {new Date().getFullYear()} CSN — Carnes Selectas Nayarit · carnesn.ink
      </footer>
    </div>
  );
}
