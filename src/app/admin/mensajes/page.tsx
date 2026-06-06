import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Convo = {
  user_id: string;
  nombre: string | null;
  email: string | null;
  ultimo: string;
  ultimo_remitente: string;
  ultima_fecha: string;
  sin_leer: number;
};

export default async function AdminMensajes() {
  await requireAdmin();
  await ensureOnlineSchema().catch(() => null);

  const convos = await prisma
    .$queryRawUnsafe<Convo[]>(
      `SELECT DISTINCT ON (m.user_id)
         m.user_id,
         u.name  AS nombre,
         u.email AS email,
         m.cuerpo AS ultimo,
         m.remitente AS ultimo_remitente,
         m.created_at AS ultima_fecha,
         (SELECT COUNT(*)::int FROM mensajes mm
            WHERE mm.user_id = m.user_id
              AND mm.remitente = 'cliente'
              AND mm.leido_admin = false) AS sin_leer
       FROM mensajes m
       LEFT JOIN users u ON u.id = m.user_id
       ORDER BY m.user_id, m.created_at DESC`
    )
    .catch(() => [] as Convo[]);

  // Ordenar por última actividad (la query ya trae el último por usuario).
  convos.sort(
    (a, b) =>
      new Date(b.ultima_fecha).getTime() - new Date(a.ultima_fecha).getTime()
  );

  const totalSinLeer = convos.reduce((a, c) => a + Number(c.sin_leer ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Mensajes</h1>
        <p className="text-sm text-on-bg-muted">
          {convos.length} conversaciones · {totalSinLeer} sin leer
        </p>
      </div>

      {convos.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-on-bg-muted">
            <MessageCircle size={24} />
          </div>
          <p className="text-on-bg-muted">Aún no hay conversaciones con clientes.</p>
        </div>
      ) : (
        <div className="card divide-y divide-hairline">
          {convos.map((c) => (
            <Link
              key={c.user_id}
              href={`/admin/mensajes/${c.user_id}`}
              className="flex items-center gap-3 p-4 transition hover:bg-surface-2/50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {(c.nombre ?? c.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">
                    {c.nombre ?? c.email ?? "Cliente"}
                  </p>
                  <span className="shrink-0 text-[11px] text-on-bg-muted">
                    {formatDateTime(c.ultima_fecha)}
                  </span>
                </div>
                <p className="truncate text-sm text-on-bg-muted">
                  {c.ultimo_remitente === "admin" && "Tú: "}
                  {c.ultimo}
                </p>
              </div>
              {Number(c.sin_leer) > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                  {c.sin_leer}
                </span>
              ) : (
                <ChevronRight size={18} className="text-on-bg-muted" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
