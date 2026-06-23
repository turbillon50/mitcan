import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/format";
import CuadreDiario from "@/components/admin/CuadreDiario";
import TicketsDashboard from "./TicketsDashboard";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  await requireAdmin();
  const hoy = new Date().toISOString().slice(0,10);

  const [cuadreRaw, ultimosRaw, sorteosRaw] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT
        COUNT(*) FILTER (WHERE estado IN ('vitrina','despachado','pagado','entregado')) AS total,
        COUNT(*) FILTER (WHERE estado IN ('pagado','entregado')) AS en_caja,
        COUNT(*) FILTER (WHERE estado = 'entregado') AS en_salida,
        COUNT(*) FILTER (WHERE estado = 'vitrina') AS pendientes_caja,
        COALESCE(SUM(monto) FILTER (WHERE estado IN ('pagado','entregado')),0) AS monto_cerrado
      FROM tickets WHERE created_at::date = CURRENT_DATE
    `).catch(() => [{}]),
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT t.*, u.name as cliente_nombre
      FROM tickets t LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC LIMIT 50
    `).catch(() => []),
    prisma.$queryRawUnsafe<Record<string,unknown>[]>(`
      SELECT s.*, u.name as ganador_nombre
      FROM sorteos s LEFT JOIN users u ON u.id = s.user_ganador_id
      ORDER BY created_at DESC LIMIT 10
    `).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Cuadre antifraude — lo primero que ve el dueño */}
      <section>
        <h1 className="section-title text-2xl mb-1">Control del día</h1>
        <p className="text-sm text-on-bg-muted mb-4">Cuadre, alarmas y cierre de caja</p>
        <CuadreDiario />
      </section>

      {/* Operación de tickets y sorteos */}
      <TicketsDashboard
        cuadre={serialize(cuadreRaw[0] ?? {}) as unknown as {total:number;en_caja:number;en_salida:number;pendientes_caja:number;monto_cerrado:number}}
        tickets={serialize(ultimosRaw) as unknown as {id:number;numero:string;estado:string;monto:number|null;created_at:string;cliente_nombre:string|null}[]}
        sorteos={serialize(sorteosRaw) as unknown as {id:number;titulo:string;premio:string;estado:string;numero_ganador:number|null;ganador_nombre:string|null}[]}
        fecha={hoy}
      />
    </div>
  );
}
