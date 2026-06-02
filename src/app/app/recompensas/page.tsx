import Image from "next/image";
import { Gift, Truck, Ticket, Percent, Award } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecompensas } from "@/lib/data";
import { formatNumber, formatDate } from "@/lib/format";
import RedeemButton from "./RedeemButton";

export const dynamic = "force-dynamic";

const TIPO_ICON: Record<string, typeof Gift> = {
  cupon: Ticket,
  descuento: Percent,
  envio: Truck,
  producto: Gift,
};

export default async function RecompensasPage() {
  const user = await getCurrentDbUser();
  const puntos = user?.puntos ?? 0;

  const [recompensas, redenciones] = await Promise.all([
    getRecompensas({ soloActivas: true }),
    user
      ? prisma.redenciones
          .findMany({
            where: { user_id: user.id },
            include: { recompensa: true },
            orderBy: { created_at: "desc" },
            take: 20,
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const disponibles = redenciones.filter((r) => r.estado === "activa").length;
  const canjeadas = redenciones.filter((r) => r.estado !== "activa").length;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="section-title text-2xl">Mis recompensas</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Puntos</p>
          <p className="text-2xl font-bold text-primary">{formatNumber(puntos)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Disponibles</p>
          <p className="text-2xl font-bold">{disponibles}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Canjeadas</p>
          <p className="text-2xl font-bold">{canjeadas}</p>
        </div>
      </div>

      {/* Catálogo de recompensas */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Canjea tus puntos</h2>
        {recompensas.length === 0 && (
          <p className="text-on-bg-muted">No hay recompensas disponibles.</p>
        )}
        {recompensas.map((r) => {
          const Icon = TIPO_ICON[r.tipo ?? "descuento"] ?? Gift;
          const bloqueada = puntos < r.puntos_requeridos;
          return (
            <article
              key={r.id}
              className={`card flex items-center gap-4 p-4 ${
                bloqueada ? "opacity-60" : ""
              }`}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2">
                {r.imagen_url ? (
                  <Image
                    src={r.imagen_url}
                    alt={r.nombre}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon size={26} className="text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold leading-tight">{r.nombre}</h3>
                <p className="text-sm text-on-bg-muted">{r.descripcion}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-primary">
                  {r.puntos_requeridos} pts
                </p>
              </div>
              <RedeemButton recompensaId={r.id} disabled={bloqueada} />
            </article>
          );
        })}
      </section>

      {/* Membership card */}
      <section className="csn-gradient relative overflow-hidden rounded-3xl border border-hairline p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Club CSN
            </span>
            <h2 className="font-display text-xl font-bold">
              {user?.nombre ?? "Miembro CSN"}
            </h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary">
            <Award size={20} className="text-primary" />
          </div>
        </div>
        <div className="mt-8 flex items-end justify-between">
          <div>
            <span className="text-xs text-on-bg-muted">Balance de puntos</span>
            <p className="font-display text-3xl font-extrabold text-primary">
              {formatNumber(puntos)} <small className="text-sm">pts</small>
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-[#0e0e0e] p-1.5">
            <Image
              src="/assets/qr-membership-sm.png"
              alt="QR personal CSN"
              width={56}
              height={56}
            />
          </div>
        </div>
      </section>

      {/* Historial de canjes */}
      {redenciones.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Historial</h2>
          {redenciones.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
            >
              <span>{r.recompensa?.nombre ?? "Recompensa"}</span>
              <span className="text-on-bg-muted">{formatDate(r.created_at)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
