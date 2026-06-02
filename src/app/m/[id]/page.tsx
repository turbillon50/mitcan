import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, User as UserIcon } from "lucide-react";
import { getCurrentDbUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import { MEMBERSHIP_KEY } from "@/lib/membership";
import SumarPuntos from "./SumarPuntos";

export const dynamic = "force-dynamic";

export default async function MemberScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { id } = await params;
  const { k } = await searchParams;

  const staff = await getCurrentDbUser();
  if (!staff) redirect(`/sign-in?redirect_url=/m/${id}`);

  // Only CSN staff may read member data from a scanned QR.
  if (!isStaff(staff.rol)) {
    return (
      <div className="csn-gradient flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <ShieldAlert className="text-primary" size={32} />
        <h1 className="text-xl font-bold">Acceso solo para personal CSN</h1>
        <p className="max-w-sm text-on-bg-muted">
          Esta pantalla es para escanear membresías en caja.
        </p>
        <Link href="/app/dashboard" className="btn-primary">
          Ir a mi panel
        </Link>
      </div>
    );
  }

  const member = await prisma.users
    .findUnique({ where: { id } })
    .catch(() => null);

  const keyOk = k === MEMBERSHIP_KEY;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex items-center gap-2 text-sm text-on-bg-muted">
        <span className="chip chip-active text-xs">Caja CSN</span>
        Escaneo de membresía
      </div>

      {!member ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <UserIcon size={32} className="text-primary/50" />
          <p className="font-bold">Membresía no encontrada</p>
          <p className="text-sm text-on-bg-muted">
            El código escaneado no corresponde a un miembro registrado.
          </p>
        </div>
      ) : (
        <>
          <section className="csn-gradient rounded-3xl border border-hairline p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Miembro {!keyOk && "· clave no válida"}
            </p>
            <h1 className="font-display text-2xl font-bold">
              {member.nombre ?? "Miembro CSN"}
            </h1>
            <p className="text-sm text-on-bg-muted">{member.email}</p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <span className="text-xs text-on-bg-muted">Puntos</span>
                <p className="font-display text-4xl font-extrabold text-primary">
                  {formatNumber(member.puntos ?? 0)}
                </p>
              </div>
              <span className="chip text-xs">{member.nivel ?? "bronce"}</span>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold">Sumar puntos por compra</h2>
            <SumarPuntos userId={member.id} />
          </section>
        </>
      )}
    </div>
  );
}
