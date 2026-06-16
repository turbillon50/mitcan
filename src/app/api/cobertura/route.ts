import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Haversine en km
function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/cobertura?lat=X&lng=Y
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");

    if (!isFinite(lat) || !isFinite(lng))
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

    // Sucursales abiertas con coordenadas
    const sucursales = await prisma.sucursales.findMany({
      where: { abierta: true, activa: true },
    });

    let mejor: typeof sucursales[0] | null = null;
    let menorDist = Infinity;

    for (const s of sucursales) {
      if (s.lat == null || s.lng == null) continue;
      const dist = distKm(lat, lng, Number(s.lat), Number(s.lng));
      if (dist < menorDist) {
        menorDist = dist;
        mejor = s;
      }
    }

    if (!mejor)
      return NextResponse.json({ cobertura: false, mensaje: "No hay sucursales disponibles en este momento." });

    const radio = Number(mejor.radio_km ?? 100);
    const dentroDeRango = menorDist <= radio;

    return NextResponse.json({
      cobertura: dentroDeRango,
      distancia_km: Math.round(menorDist * 10) / 10,
      sucursal: dentroDeRango ? {
        id: mejor.id,
        nombre: mejor.nombre,
        lat: Number(mejor.lat),
        lng: Number(mejor.lng),
        direccion: mejor.direccion,
        telefono: mejor.telefono,
        whatsapp: mejor.whatsapp,
        radio_km: radio,
      } : null,
      mensaje: dentroDeRango
        ? `Entrega disponible desde ${mejor.nombre} (${Math.round(menorDist * 10) / 10} km)`
        : `Lo sentimos, actualmente no contamos con servicio a domicilio en tu zona. La sucursal más cercana (${mejor.nombre}) está a ${Math.round(menorDist * 10) / 10} km y nuestro rango de entrega es de ${radio} km.`,
    });
  } catch (err) {
    console.error("[GET /api/cobertura]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
