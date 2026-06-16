import { prisma } from "@/lib/prisma";
import { requireRepartidor } from "@/lib/auth";
import RepartidorMapView from "./RepartidorMapView";
import { getMapboxToken } from "@/lib/mapbox";
import { serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTIVOS = ["asignado", "entregado_repartidor", "en_camino"];

function startOfToday() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}

export default async function RepartidorPage() {
  const user = await requireRepartidor();

  const [pedidosRaw, entregadosHoy] = await Promise.all([
    prisma.pedidos.findMany({
      where: { repartidor_id: user.id, estado: { in: ACTIVOS } },
      include: { items: { include: { producto: true } }, sucursal: true, user: true },
      orderBy: { asignado_at: "desc" },
    }).catch(() => []),
    prisma.pedidos.count({
      where: { repartidor_id: user.id, estado: "ha_llegado", entregado_at: { gte: startOfToday() } },
    }).catch(() => 0),
  ]);

  const token = getMapboxToken();

  const pedidos = pedidosRaw.map((p, idx) => ({
    id: p.id,
    folio: p.folio,
    estado: p.estado ?? "asignado",
    total: Number(p.total ?? 0),
    direccion_entrega: p.direccion_entrega,
    telefono_entrega: p.telefono_entrega ?? p.user?.telefono ?? null,
    cliente: p.user?.nombre ?? null,
    notas: p.notas,
    orden: idx + 1,
    // Coordenadas de la dirección de entrega — solo tenemos lat/lng de sucursal
    // como punto de origen; el destino es texto libre del cliente.
    // Pasamos la dirección para que el mapa abra Google Maps directamente.
    lat: null as number | null,
    lng: null as number | null,
    items: p.items.map(it => ({
      id: it.id, cantidad: Number(it.cantidad),
      nombre: it.producto?.nombre ?? "Producto",
    })),
  }));

  return <RepartidorMapView
    pedidos={serialize(pedidos)}
    entregadosHoy={entregadosHoy}
    nombre={user.nombre ?? "Repartidor"}
    mapboxToken={token ?? ""}
  />;
}
