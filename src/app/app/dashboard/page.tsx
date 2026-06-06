import Link from "next/link";
import { ChevronRight, Flame, QrCode, Bike, MessageCircle } from "lucide-react";
import { getCurrentDbUser, isRepartidor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecompensas } from "@/lib/data";
import { formatNumber, formatMXN, serialize } from "@/lib/format";
import { membershipUrl } from "@/lib/membership";
import StatusBadge from "@/components/StatusBadge";
import MembershipQR from "@/components/MembershipQR";

export const dynamic = "force-dynamic";

const NIVELES = [
  { nombre: "Taquero Oficial 🥩", min: 0 },
  { nombre: "Maestro del Carbón 🔥", min: 400 },
  { nombre: "Leyenda Parrillera 👑", min: 1000 },
];

function nivelDe(puntos: number) {
  let actual = NIVELES[0];
  let siguiente = NIVELES[1] ?? null;
  for (let i = 0; i < NIVELES.length; i++) {
    if (puntos >= NIVELES[i].min) {
      actual = NIVELES[i];
      siguiente = NIVELES[i + 1] ?? null;
    }
  }
  const faltan = siguiente ? Math.max(0, siguiente.min - puntos) : 0;
  const rango = siguiente ? siguiente.min - actual.min : 1;
  const progreso = siguiente
    ? Math.min(100, Math.round(((puntos - actual.min) / rango) * 100))
    : 100;
  return { actual, siguiente, faltan, progreso };
}

export default async function DashboardPage() {
  const user = await getCurrentDbUser();
  const puntos = user?.puntos ?? 0;
  const { actual, siguiente, faltan, progreso } = nivelDe(puntos);

  const [recompensas, ultimoPedido] = await Promise.all([
    getRecompensas({ soloActivas: true }),
    user
      ? prisma.pedidos
          .findFirst({
            where: { user_id: user.id },
            orderBy: { created_at: "desc" },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const promos = serialize(recompensas.slice(0, 5));

  const repartidor = isRepartidor(user?.rol);

  return (
    <div className="flex flex-col gap-7">
      {/* Acceso rápido para repartidores (moto) */}
      {repartidor && (
        <Link
          href="/app/repartidor"
          className="card flex items-center gap-3 border-primary/30 bg-primary/5 p-4"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bike size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Panel de repartidor</p>
            <p className="text-sm text-on-bg-muted">Ver mis entregas asignadas</p>
          </div>
          <ChevronRight size={18} className="text-on-bg-muted" />
        </Link>
      )}

      {/* Centro de mensajes con la tienda */}
      <Link
        href="/app/mensajes"
        className="card flex items-center gap-3 p-4"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircle size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Mensajes</p>
          <p className="text-sm text-on-bg-muted">Habla directo con CSN</p>
        </div>
        <ChevronRight size={18} className="text-on-bg-muted" />
      </Link>

      {/* Greeting + points */}
      <section className="csn-gradient rounded-3xl border border-hairline p-6">
        <h1 className="font-display text-2xl font-bold">
          Hola, {user?.nombre?.split(" ")[0] ?? "parrillero"} 👋
        </h1>
        <p className="mt-4 text-sm text-on-bg-muted">Tus puntos</p>
        <p className="font-display text-5xl font-extrabold text-primary">
          {formatNumber(puntos)}
        </p>
        {siguiente ? (
          <p className="mt-2 text-sm text-on-bg-muted">
            Te faltan <strong className="text-on-bg">{faltan} puntos</strong> para
            llegar a <strong className="text-on-bg">{siguiente.nombre}</strong>
          </p>
        ) : (
          <p className="mt-2 text-sm text-on-bg-muted">
            ¡Estás en el nivel máximo! 🎉
          </p>
        )}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent shadow-glow"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3 py-1.5">
          <span className="text-xs text-on-bg-muted">Nivel actual</span>
          <span className="text-xs font-bold">{actual.nombre}</span>
        </div>
      </section>

      {/* Membership QR */}
      <section className="card flex flex-col items-center gap-4 p-7 text-center">
        <div className="rounded-2xl border border-hairline bg-surface-2 p-3">
          {user ? <MembershipQR value={membershipUrl(user.id)} size={196} /> : null}
        </div>
        <div>
          <h2 className="flex items-center justify-center gap-2 text-xl font-bold">
            <QrCode size={20} className="text-primary" /> Escanea en caja
          </h2>
          <p className="mt-1 max-w-xs text-sm text-on-bg-muted">
            Suma puntos en cada compra y desbloquea recompensas en tu carnicería
            favorita.
          </p>
        </div>
      </section>

      {/* Last order */}
      {ultimoPedido && (
        <section>
          <h3 className="section-title mb-3 text-xl">Tu último pedido</h3>
          <Link
            href="/app/pedido"
            className="card flex items-center justify-between p-4"
          >
            <div>
              <p className="text-xs text-on-bg-muted">
                {ultimoPedido.folio ?? `#${ultimoPedido.id}`}
              </p>
              <p className="font-bold">{formatMXN(Number(ultimoPedido.total))}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge estado={ultimoPedido.estado} />
              <ChevronRight size={18} className="text-on-bg-muted" />
            </div>
          </Link>
        </section>
      )}

      {/* Promos */}
      {promos.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="section-title flex items-center gap-2 text-xl">
              <Flame size={18} className="text-primary" /> Promos para ti
            </h3>
            <Link
              href="/app/recompensas"
              className="text-sm font-semibold text-primary"
            >
              Ver todas
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {promos.map((r) => (
              <div
                key={r.id}
                className="card min-w-[240px] p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{r.nombre}</h4>
                  <span className="chip chip-active text-[10px]">
                    {r.puntos_requeridos} pts
                  </span>
                </div>
                <p className="mt-1 text-sm text-on-bg-muted">{r.descripcion}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
