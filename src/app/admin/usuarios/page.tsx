import { prisma } from "@/lib/prisma";
import { formatNumber, formatDate } from "@/lib/format";
import InlineSelect from "@/components/admin/InlineSelect";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { updateUserRol } from "../actions";
import type { user_role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ROL_OPTS = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "empleado", label: "Empleado" },
  { value: "cliente", label: "Cliente" },
];

const ROL_COLOR: Record<string, string> = {
  admin: "chip-active",
  gerente: "chip-active",
  empleado: "",
  cliente: "",
};

export default async function AdminUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireAdmin();
  const canEdit = isAdmin(me.rol);
  const sp = await searchParams;
  const q = sp.q?.trim();

  const usuarios = await prisma.users
    .findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { created_at: "desc" },
      take: 200,
    })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Usuarios</h1>
        <p className="text-sm text-on-bg-muted">
          {usuarios.length} usuarios
          {!canEdit && " · solo administradores pueden cambiar roles"}
        </p>
      </div>

      <form className="flex gap-2" action="/admin/usuarios">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o email…"
          className="input max-w-xs"
        />
        <button className="btn-ghost" type="submit">
          Buscar
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.nombre ?? "—"}</p>
                  <p className="text-xs text-on-bg-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 font-medium text-primary">
                  {formatNumber(u.puntos)}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  {canEdit ? (
                    <InlineSelect
                      value={u.rol}
                      options={ROL_OPTS}
                      action={async (next) => {
                        "use server";
                        await updateUserRol(u.id, next as user_role);
                      }}
                    />
                  ) : (
                    <span className={`chip text-xs ${ROL_COLOR[u.rol] ?? ""}`}>
                      {ROL_OPTS.find((r) => r.value === u.rol)?.label ?? u.rol}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
