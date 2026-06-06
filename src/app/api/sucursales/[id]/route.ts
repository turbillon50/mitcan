import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";
import { inServiceArea } from "@/lib/mapbox";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const sucursal = await prisma.sucursales.findUnique({
    where: { id: parseInt(id) },
  });
  if (!sucursal) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(sucursal);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();

  // Whitelist updatable fields — never blind-spread the request body, which
  // previously let any caller overwrite arbitrary columns (incl. coordinates).
  const data: Record<string, unknown> = {};
  if (typeof b.nombre === "string") data.nombre = b.nombre;
  if (typeof b.area === "string") data.area = b.area;
  if ("direccion" in b) data.direccion = b.direccion ?? null;
  if ("telefono" in b) data.telefono = b.telefono ?? null;
  if ("whatsapp" in b) data.whatsapp = b.whatsapp ?? null;
  if ("horario" in b) data.horario = b.horario ?? null;
  if (typeof b.activa === "boolean") data.activa = b.activa;

  // Coordinates only change together and only when inside the CSN service area.
  if (b.lat != null && b.lng != null) {
    const lat = Number(b.lat);
    const lng = Number(b.lng);
    if (!inServiceArea(lat, lng)) {
      return NextResponse.json(
        { error: "Coordenadas fuera del área de servicio (Nayarit/Mazatlán/Vallarta)." },
        { status: 422 }
      );
    }
    data.lat = lat;
    data.lng = lng;
  }

  const sucursal = await prisma.sucursales.update({
    where: { id: parseInt(id) },
    data,
  });
  return NextResponse.json(sucursal);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  await prisma.sucursales.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
