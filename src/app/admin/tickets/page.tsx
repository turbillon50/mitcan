import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/format";
import TicketsDashboard from "./TicketsDashboard";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  await requireAdmin();

  const hoy = new Date().toISOString().slice(0,10);

  const [cuadreRaw, ultimosRaw, sorteosRaw] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT
        COUNT(*) FILTER (WHERE estado IN ('vitrina','caja','salida')) AS total,
        COUNT(*) FILTER (WHERE estado IN ('caja','salida')) AS en_caja,
        COUNT(*) FILTER (WHERE estado = 'salida') AS en_salida,
        COUNT(*) FILTER (WHERE estado = 'vitrina') AS pendientes_caja,
        COALESCE(SUM(monto) FILTER (WHERE estado = 'salida'),0) AS monto_cerrado
      FROM tickets WHERE created_at::date = CURRENT_DATE
    `),
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT t.*, u.nombre as cliente_nombre
      FROM tickets t LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC LIMIT 50
    `),
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT s.*, u.nombre as ganador_nombre
      FROM sorteos s LEFT JOIN users u ON u.id = s.user_ganador_id
      ORDER BY created_at DESC LIMIT 10
    `),
  ]);

  return <TicketsDashboard
    cuadre={serialize(cuadreRaw[0])}
    tickets={serialize(ultimosRaw)}
    sorteos={serialize(sorteosRaw)}
    fecha={hoy}
  />;
}
