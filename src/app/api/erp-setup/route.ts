import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMapboxToken, geocode } from "@/lib/mapbox";

// TEMPORARY: review branches, geocode missing coordinates, and seed the June
// promotions. Removed after running once.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "csn-erp-2026";

const PROMOS: { titulo: string; precio: number; pieza?: boolean; nuevo?: boolean }[] = [
  { titulo: "Tasajo de Sirloin", precio: 196.9 },
  { titulo: "Arrachera Marinada", precio: 109.9 },
  { titulo: "Chorizo Argentino para Asar PAOSA", precio: 65.9, pieza: true },
  { titulo: "Carne para Birria", precio: 126.9 },
  { titulo: "Chicharrón Estilo Norteño", precio: 129.9, pieza: true, nuevo: true },
  { titulo: "Queso Oaxaca Los Abuelos", precio: 109.9, nuevo: true },
  { titulo: "Picaña Marinada", precio: 109.9 },
  { titulo: "Pollo Fresco", precio: 54.9 },
  { titulo: "Pechuga S/H Congelada", precio: 72.9 },
  { titulo: "Chamorro de Cerdo", precio: 48.9 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const doGeocode = searchParams.get("geocode") !== "0";
  const doPromos = searchParams.get("promos") !== "0";

  const token = getMapboxToken();
  const out: Record<string, unknown> = { mapboxToken: token ? "present" : "MISSING" };

  // 1) Geocode branches missing coordinates.
  const sucursales = await prisma.sucursales.findMany({ orderBy: { id: "asc" } });
  const geocoded: string[] = [];
  if (doGeocode && token) {
    for (const s of sucursales) {
      if (s.lat != null && s.lng != null) continue;
      const query = s.direccion ?? `${s.nombre}, ${s.area}, Nayarit, México`;
      const geo = await geocode(query, token);
      if (geo) {
        await prisma.sucursales.update({
          where: { id: s.id },
          data: { lat: geo.lat, lng: geo.lng },
        });
        geocoded.push(`${s.id}:${s.nombre}`);
      }
    }
  }

  // 2) Seed June promos (idempotent by titulo).
  const seeded: string[] = [];
  if (doPromos) {
    const inicio = new Date("2026-06-01T00:00:00Z");
    const fin = new Date("2026-06-30T23:59:59Z");
    for (const p of PROMOS) {
      const exists = await prisma.promociones.findFirst({ where: { titulo: p.titulo } });
      if (exists) continue;
      await prisma.promociones.create({
        data: {
          titulo: p.titulo + (p.nuevo ? " 🆕" : ""),
          descripcion: `$${p.precio.toFixed(2)} / ${p.pieza ? "pza" : "kg"} · Exclusivo Tepic, Xalisco e Ixtlán del Río`,
          tipo: "monto",
          valor: p.precio,
          fecha_inicio: inicio,
          fecha_fin: fin,
          activa: true,
        },
      });
      seeded.push(p.titulo);
    }
  }

  const after = await prisma.sucursales.findMany({
    orderBy: { id: "asc" },
    select: { id: true, nombre: true, area: true, direccion: true, lat: true, lng: true },
  });

  out.sucursalesCount = after.length;
  out.geocoded = geocoded;
  out.promosSeeded = seeded;
  out.sucursales = after.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    area: s.area,
    direccion: s.direccion,
    located: s.lat != null && s.lng != null,
  }));

  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
