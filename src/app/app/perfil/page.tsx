import { SignOutButton } from "@clerk/nextjs";
import { LogOut, ShieldCheck } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { actualizarPerfil } from "./actions";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  empleado: "Empleado",
  cliente: "Cliente",
};

export default async function PerfilPage() {
  const user = await getCurrentDbUser();

  return (
    <div className="flex flex-col gap-7">
      <h1 className="section-title text-2xl">Mi perfil</h1>

      <section className="csn-gradient flex items-center justify-between rounded-3xl border border-hairline p-6">
        <div>
          <p className="font-display text-xl font-bold">
            {user?.nombre ?? "Miembro CSN"}
          </p>
          <p className="text-sm text-on-bg-muted">{user?.email}</p>
          <span className="chip chip-active mt-2 text-xs">
            <ShieldCheck size={13} /> {ROL_LABEL[user?.rol ?? "cliente"]}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-bg-muted">Puntos</p>
          <p className="font-display text-3xl font-extrabold text-primary">
            {formatNumber(user?.puntos ?? 0)}
          </p>
        </div>
      </section>

      <form action={actualizarPerfil} className="card flex flex-col gap-4 p-5">
        <h2 className="text-lg font-bold">Datos personales</h2>
        <div>
          <label className="label" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            defaultValue={user?.nombre ?? ""}
            className="input"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="label" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            defaultValue={user?.telefono ?? ""}
            className="input"
            placeholder="10 dígitos"
          />
        </div>
        <button type="submit" className="btn-primary self-start">
          Guardar cambios
        </button>
      </form>

      <SignOutButton redirectUrl="/">
        <button className="btn-danger self-start">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </SignOutButton>
    </div>
  );
}
