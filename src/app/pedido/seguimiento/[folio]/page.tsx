import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMapboxToken, geocode } from "@/lib/mapbox";
import { prisma } from "@/lib/prisma";
import SeguimientoClient from "@/components/pedido/SeguimientoClient";

export const metadata: Metadata = { title: "Seguimiento — CSN" };
export const dynamic = "force-dynamic";

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  await requireUser();
  const { folio } = await params;
  const mapboxToken = getMapboxToken() ?? "";

  // Intentar geocodificar la dirección de entrega para el mapa
  let destLat: number | null = null;
  let destLng: number | null = null;
  try {
    const pedido = await prisma.pedidos.findFirst({
      where: { folio },
      select: { direccion_entrega: true },
    });
    if (pedido?.direccion_entrega && mapboxToken) {
      const coords = await geocode(pedido.direccion_entrega + " Tepic Nayarit Mexico", mapboxToken);
      if (coords) { destLat = coords.lat; destLng = coords.lng; }
    }
  } catch { /* no bloquea */ }

  return (
    <SeguimientoClient
      folio={folio}
      mapboxToken={mapboxToken}
      destLat={destLat}
      destLng={destLng}
    />
  );
}
