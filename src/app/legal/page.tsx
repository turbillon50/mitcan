import PublicHeader from "@/components/PublicHeader";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export const metadata = {
  title: "Aviso de Privacidad y Términos — CSN Carnes Selectas Nayarit",
  description:
    "Aviso de Privacidad y Términos y Condiciones de uso del sitio, el catálogo, el pedido en línea y el club de recompensas de CSN Carnes Selectas Nayarit.",
};

export default function LegalPage() {
  return (
    <div className="min-h-dvh pb-24 md:pb-12">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="section-title mb-2 text-3xl">Aviso de Privacidad y Términos</h1>
        <p className="mb-8 text-on-bg-muted">
          Carnes Selectas Nayarit (CSN) · carnesn.ink
        </p>

        <section id="privacidad" className="scroll-mt-24">
          <h2 className="section-title text-2xl">Aviso de Privacidad</h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-on-bg-muted">
            <p>
              CSN — Carnes Selectas Nayarit es responsable del tratamiento de los datos
              personales que nos proporcionas al crear tu cuenta, realizar un pedido en
              línea o participar en el club de recompensas.
            </p>
            <p>
              <strong>Datos que recabamos.</strong> Nombre, teléfono, correo electrónico,
              sucursal de preferencia y, cuando haces un pedido, la dirección de entrega.
              No solicitamos ni almacenamos datos de tarjetas: el pedido en línea es de
              pago contra entrega.
            </p>
            <p>
              <strong>Para qué los usamos.</strong> Para procesar y entregar tus pedidos,
              acreditar y canjear puntos de recompensas, darte seguimiento y enviarte
              notificaciones relacionadas con tu cuenta y tus compras.
            </p>
            <p>
              <strong>Tus derechos (ARCO).</strong> Puedes solicitar el acceso,
              rectificación, cancelación u oposición al tratamiento de tus datos, así como
              revocar tu consentimiento, contactando a tu sucursal CSN más cercana.
            </p>
            <p>
              No compartimos tus datos con terceros para fines de mercadotecnia. Solo se
              usan para operar el servicio que solicitas.
            </p>
          </div>
        </section>

        <section id="terminos" className="mt-12 scroll-mt-24">
          <h2 className="section-title text-2xl">Términos y Condiciones</h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-on-bg-muted">
            <p>
              <strong>Catálogo y precios.</strong> Los productos, precios y promociones se
              muestran por categoría y pueden variar por sucursal y disponibilidad. Los
              precios se confirman al momento de la compra o entrega.
            </p>
            <p>
              <strong>Pedido en línea.</strong> El pedido en línea está disponible en las
              zonas indicadas, con pago contra entrega y el costo de envío señalado al
              confirmar. La disponibilidad de cada producto está sujeta a existencias.
            </p>
            <p>
              <strong>Club de recompensas.</strong> Los puntos se acumulan en compras
              elegibles y pueden canjearse por cupones, descuentos o envíos según las
              recompensas vigentes. Los puntos no tienen valor en efectivo.
            </p>
            <p>
              <strong>Uso del sitio.</strong> Al usar el sitio aceptas estos términos y el
              Aviso de Privacidad. CSN puede actualizar el catálogo, las promociones y
              estos términos cuando sea necesario.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <Link href="/" className="btn-ghost">← Volver al inicio</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
