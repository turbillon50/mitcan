import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import InlineSelect from "@/components/admin/InlineSelect";
import { updateRedencionEstado } from "../actions";

export const dynamic = "force-dynamic";

const ESTADO_OPTS = [
  { value: "activa", label: "Activa" },
  { value: "usada", label: "Usada" },
  { value: "expirada", label: "Expirada" },
];

export default async function AdminRedenciones() {
  const redenciones = await prisma.redenciones
    .findMany({
      include: { user: true, recompensa: true },
      orderBy: { created_at: "desc" },
      take: 200,
    })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Redenciones</h1>
        <p className="text-sm text-on-bg-muted">
          {redenciones.length} canjes de recompensas
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Recompensa</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {redenciones.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-on-bg-muted">
                  {formatDateTime(r.created_at)}
                </td>
                <td className="px-4 py-3">
                  {r.user?.nombre ?? r.user?.email ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {r.recompensa?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 text-primary">{r.puntos_usados}</td>
                <td className="px-4 py-3">
                  <InlineSelect
                    value={r.estado ?? "activa"}
                    options={ESTADO_OPTS}
                    action={async (next) => {
                      "use server";
                      await updateRedencionEstado(r.id, next);
                    }}
                  />
                </td>
              </tr>
            ))}
            {redenciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
                  Aún no hay canjes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
