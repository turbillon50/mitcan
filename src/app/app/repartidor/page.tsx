import { Bike, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRepartidor } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";
import RepartidorPedidoCard, { type RiderPedido } from "@/components/RepartidorPedidoCard";

export const dynamic = "force-dynamic";

const ACTIVOS = ["asignado", "entregado_repartidor", "en_camino"];

export default async function RepartidorPage() {
  const user = await requireRepartidor();
  await ensureOnlineSchema().catch(() => null);

  const pedidosRaw = await prisma.pedidos
    .findMany({
      where: {
        repartidor_id: user.id,
        estado: { in: ACTIVOS },
      },
      include: {
        items: { include: { producto: true } },
        sucursal: true,
        user: true,
      },
      orderBy: { asignado_at: "desc" },
    })
    .catch(() => []);

  const entregadosHoy = await prisma.pedidos
    .count({
      where: {
        repartidor_id: user.id,
        estado: "ha_llegado",
        entregado_at: { gte: startOfToday() },
      },
    })
    .catch(() => 0);

  const pedidos: RiderPedido[] = pedidosRaw.map((p) => ({
    id: p.id,
    folio: p.folio,
    estado: p.estado ?? "asignado",
    total: Number(p.total ?? 0),
    direccion_entrega: p.direccion_entrega,
    telefono_entrega: p.telefono_entrega ?? p.user?.telefono ?? null,
    cliente: p.user?.nombre ?? null,
    lat: p.sucursal?.lat != null ? Number(p.sucursal.lat) : null,
    lng: p.sucursal?.lng != null ? Number(p.sucursal.lng) : null,
    items: p.items.map((it) => ({
      id: it.id,
      cantidad: Number(it.cantidad),
      nombre: it.producto?.nombre ?? "Producto",
    })),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bike size={22} />
        </div>
        <div>
          <h1 className="section-title text-2xl">Mis entregas</h1>
          <p className="text-sm text-on-bg-muted">
            {pedidos.length} activas · {entregadosHoy} entregadas hoy
          </p>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-on-bg-muted">
            <PackageCheck size={24} />
          </div>
          <p className="text-on-bg-muted">No tienes entregas asignadas ahora mismo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <RepartidorPedidoCard key={p.id} pedido={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
