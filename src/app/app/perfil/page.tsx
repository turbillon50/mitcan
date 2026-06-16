import { SignOutButton } from "@clerk/nextjs";
import { getCurrentDbUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { actualizarPerfil } from "./actions";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador", gerente: "Gerente",
  empleado: "Empleado", cliente: "Cliente", repartidor: "Repartidor",
};

export default async function PerfilPage() {
  const user = await getCurrentDbUser();
  const numCliente = user?.numero_cliente;

  return (
    <div className="flex flex-col gap-7">
      <h1 className="section-title text-2xl">Mi perfil</h1>

      <section className="csn-gradient flex flex-col gap-4 rounded-3xl border border-hairline p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xl font-bold">{user?.nombre ?? "Miembro CSN"}</p>
            <p className="text-sm text-on-bg-muted">{user?.email}</p>
            <span className="chip chip-active mt-2 text-xs">
              {ROL_LABEL[user?.rol ?? "cliente"]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-bg-muted">Puntos</p>
            <p className="font-display text-3xl font-extrabold text-primary">
              {formatNumber(user?.puntos ?? 0)}
            </p>
          </div>
        </div>

        {/* Número de cliente — boleto permanente del sorteo */}
        {numCliente ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <p className="text-xs font-semibold text-on-bg-muted">Tu número de cliente</p>
            <p className="font-mono text-3xl font-extrabold tracking-widest text-primary">
              #{String(numCliente).padStart(5, "0")}
            </p>
            <p className="mt-1 text-xs text-on-bg-muted">
              Este es tu boleto permanente para los sorteos CSN. Pide tu ticket en caja y que el revisor de salida lo escanee para participar.
            </p>
          </div>
        ) : null}
      </section>

      <form action={actualizarPerfil} className="card flex flex-col gap-4 p-5">
        <h2 className="text-lg font-bold">Datos personales</h2>
        <div>
          <label className="label" htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" className="input" defaultValue={user?.nombre ?? ""} placeholder="Tu nombre" />
        </div>
        <div>
          <label className="label" htmlFor="telefono">Teléfono</label>
          <input id="telefono" name="telefono" type="tel" className="input" defaultValue={user?.telefono ?? ""} placeholder="311 000 0000" />
        </div>
        <div>
          <label className="label" htmlFor="direccion">Dirección predeterminada</label>
          <textarea id="direccion" name="direccion" rows={3} className="input resize-none" defaultValue={user?.direccion ?? ""} placeholder="Calle, número, colonia…" />
        </div>
        <button type="submit" className="btn-primary py-3">Guardar cambios</button>
      </form>

      <div className="card p-5">
        <SignOutButton>
          <button className="btn-ghost w-full text-rose-400">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
