import { Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import DeleteButton from "@/components/admin/DeleteButton";
import { enviarNotificacion, deleteNotificacion } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminNotificaciones() {
  const [notis, totalUsers] = await Promise.all([
    prisma.notificaciones
      .findMany({
        include: { user: true },
        orderBy: { created_at: "desc" },
        take: 50,
      })
      .catch(() => []),
    prisma.users.count().catch(() => 0),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Notificaciones</h1>
        <p className="text-sm text-on-bg-muted">
          Envía avisos a los clientes ({totalUsers} usuarios)
        </p>
      </div>

      <form action={enviarNotificacion} className="card flex flex-col gap-4 p-5">
        <h2 className="font-bold">Nueva notificación</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Título</label>
            <input name="titulo" className="input" required placeholder="Promo del fin de semana 🔥" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select name="tipo" className="input" defaultValue="general">
              <option value="general">General</option>
              <option value="promo">Promo</option>
              <option value="puntos">Puntos</option>
              <option value="pedido">Pedido</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Mensaje</label>
          <textarea name="mensaje" className="input min-h-[80px]" required />
        </div>
        <div>
          <label className="label">Destino (email) — vacío = todos los clientes</label>
          <input name="destino" className="input" placeholder="cliente@correo.com (opcional)" />
        </div>
        <button type="submit" className="btn-primary self-start">
          <Send size={16} /> Enviar
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Destinatario</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Leída</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {notis.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-3 text-on-bg-muted">{formatDateTime(n.created_at)}</td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {n.user?.nombre ?? n.user?.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{n.titulo}</p>
                  <p className="max-w-xs truncate text-xs text-on-bg-muted">{n.mensaje}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`chip text-xs ${n.leida ? "" : "chip-active"}`}>
                    {n.leida ? "Leída" : "Nueva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DeleteButton
                      action={deleteNotificacion.bind(null, n.id)}
                      confirmText="¿Eliminar esta notificación?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {notis.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay notificaciones enviadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
