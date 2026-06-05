import Link from "next/link";
import { Phone, Truck, BadgeDollarSign, RotateCcw } from "lucide-react";
import { getCategorias } from "@/lib/data";
import { TEL_PEDIDOS, TEL_PEDIDOS_DISPLAY, ENVIO_FIJO } from "@/lib/online-const";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const EMOJI: Record<string, string> = {
  res: "🥩",
  cerdo: "🥓",
  pollo: "🍗",
  mariscos: "🦐",
  "carnes-frias": "🌭",
  quesos: "🧀",
  otros: "🛒",
};

export default async function PedidoEnLinea() {
  const [categorias, { userId }] = await Promise.all([getCategorias(), auth()]);
  const activas = categorias.filter((c) => c.activa !== false);

  return (
    <div className="flex flex-col gap-7 pb-6">
      {/* Hero compacto */}
      <section className="csn-gradient rounded-3xl border border-hairline p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Pedido en línea</h1>
        <p className="mt-1 max-w-xl text-sm text-on-bg-muted md:text-base">
          Elige tus cortes, arma tu carrito y recíbelo en tu puerta. Cobertura en
          Tepic, Nayarit desde nuestro centro de distribución Nayarabastos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="chip"><Truck size={13} className="text-primary" /> Entrega a domicilio ${ENVIO_FIJO}</span>
          <span className="chip"><BadgeDollarSign size={13} className="text-primary" /> Pago contra entrega</span>
          <span className="chip"><RotateCcw size={13} className="text-primary" /> Acumula puntos</span>
        </div>
      </section>

      {/* Categorías */}
      <section>
        <h2 className="section-title mb-4 text-xl">Categorías</h2>
        {activas.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-surface-2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activas.map((c) => (
              <Link
                key={c.id}
                href={`/pedido/c/${c.slug}`}
                className="card group flex h-28 flex-col items-center justify-center gap-2 p-4 transition hover:border-primary/40 hover:shadow-glow"
              >
                <span className="text-3xl transition group-hover:scale-110">
                  {c.icono || EMOJI[c.slug] || "🥩"}
                </span>
                <span className="text-center text-sm font-bold">{c.nombre}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Llamar para pedir */}
      <section className="card flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="font-display text-lg font-bold">¿Prefieres pedir por teléfono?</h3>
          <p className="text-sm text-on-bg-muted">
            Llámanos y armamos tu pedido contigo · {TEL_PEDIDOS_DISPLAY}
          </p>
        </div>
        <a href={`tel:${TEL_PEDIDOS}`} className="btn-primary px-5 py-3">
          <Phone size={16} /> Llamar para pedir
        </a>
      </section>

      {!userId && (
        <p className="text-center text-xs text-on-bg-muted">
          Puedes explorar sin cuenta; para confirmar tu pedido te pediremos{" "}
          <Link href="/sign-up" className="font-semibold text-primary">crear una cuenta</Link>.
        </p>
      )}
    </div>
  );
}
