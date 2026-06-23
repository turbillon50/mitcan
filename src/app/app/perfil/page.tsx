import { SignOutButton } from "@clerk/nextjs";
import { getCurrentDbUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { actualizarPerfil } from "./actions";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ROL_KEY: Record<string, string> = {
  admin: "role.admin", gerente: "role.manager",
  empleado: "role.employee", cliente: "role.customer", repartidor: "role.driver",
  vitrinero: "role.vitrinero", cajero: "role.cashier", revisor: "role.reviewer",
};

export default async function PerfilPage() {
  const user = await getCurrentDbUser();
  const locale = await getLocale();
  const tr = (k: string) => t(locale, k);
  const numCliente = user?.numero_cliente;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="section-title text-2xl">{tr("profile.title")}</h1>

      <section className="csn-gradient flex flex-col gap-4 rounded-3xl border border-hairline p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xl font-bold">{user?.nombre ?? tr("profile.member")}</p>
            <p className="text-sm text-on-bg-muted">{user?.email}</p>
            <span className="chip chip-active mt-2 text-xs">
              {tr(ROL_KEY[user?.rol ?? "cliente"] ?? "role.customer")}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-bg-muted">{tr("rewards.points")}</p>
            <p className="font-display text-3xl font-extrabold text-primary">
              {formatNumber(user?.puntos ?? 0)}
            </p>
          </div>
        </div>

        {numCliente ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <p className="text-xs font-semibold text-on-bg-muted">{tr("profile.customerNumber")}</p>
            <p className="font-mono text-3xl font-extrabold tracking-widest text-primary">
              #{String(numCliente).padStart(5, "0")}
            </p>
            <p className="mt-1 text-xs text-on-bg-muted">
              {tr("profile.customerNumberHint")}
            </p>
          </div>
        ) : null}
      </section>

      <form action={actualizarPerfil} className="card flex flex-col gap-4 p-5">
        <h2 className="text-lg font-bold">{tr("profile.personalData")}</h2>
        <div>
          <label className="label" htmlFor="nombre">{tr("profile.name")}</label>
          <input id="nombre" name="nombre" className="input" defaultValue={user?.nombre ?? ""} placeholder={tr("profile.namePlaceholder")} />
        </div>
        <div>
          <label className="label" htmlFor="telefono">{tr("profile.phone")}</label>
          <input id="telefono" name="telefono" type="tel" className="input" defaultValue={user?.telefono ?? ""} placeholder="311 000 0000" />
        </div>
        <div>
          <label className="label" htmlFor="direccion">{tr("profile.defaultAddress")}</label>
          <textarea id="direccion" name="direccion" rows={3} className="input resize-none" defaultValue={user?.direccion ?? ""} placeholder={tr("checkout.addressPlaceholder")} />
        </div>
        <button type="submit" className="btn-primary py-3">{tr("profile.save")}</button>
      </form>

      <div className="card p-5">
        <SignOutButton>
          <button className="btn-ghost w-full text-rose-400">
            {tr("profile.logout")}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
