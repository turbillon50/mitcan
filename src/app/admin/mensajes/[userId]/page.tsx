import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getThread, marcarLeidos } from "@/lib/mensajes";
import { formatDateTime } from "@/lib/format";
import { responderMensaje } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminThread({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const [cliente, mensajes] = await Promise.all([
    prisma.users
      .findUnique({ where: { id: userId }, select: { nombre: true, email: true, telefono: true } })
      .catch(() => null),
    getThread(userId),
  ]);
  // Marcar como leídos los mensajes del cliente al abrir el hilo.
  await marcarLeidos(userId, "admin").catch(() => null);

  const responder = responderMensaje.bind(null, userId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/mensajes"
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <ChevronLeft size={15} /> Mensajes
        </Link>
        <h1 className="section-title text-2xl">
          {cliente?.nombre ?? cliente?.email ?? "Cliente"}
        </h1>
        {cliente?.email && (
          <p className="text-sm text-on-bg-muted">{cliente.email}</p>
        )}
      </div>

      <div className="card flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto p-4">
        {mensajes.length === 0 && (
          <p className="py-8 text-center text-sm text-on-bg-muted">
            Sin mensajes todavía.
          </p>
        )}
        {mensajes.map((m) => {
          const admin = m.remitente === "admin";
          return (
            <div key={m.id} className={`flex flex-col ${admin ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  admin
                    ? "rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm bg-surface-2 text-on-bg"
                }`}
              >
                <p className="whitespace-pre-line">{m.cuerpo}</p>
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-on-bg-muted">
                {admin ? m.autor_nombre ?? "CSN" : "Cliente"} · {formatDateTime(m.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      <form action={responder} className="flex items-end gap-2">
        <textarea
          name="cuerpo"
          required
          rows={2}
          placeholder="Escribe una respuesta…"
          className="input max-h-40 min-h-[52px] flex-1 resize-none"
        />
        <button type="submit" className="btn-primary h-[52px] px-5">
          <Send size={16} /> Enviar
        </button>
      </form>
    </div>
  );
}
