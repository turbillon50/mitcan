import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const area = searchParams.get("area");
  const sucursales = await prisma.sucursales.findMany({
    where: { ...(all ? {} : { activa: true }), ...(area ? { area } : {}) },
    orderBy: { id: "asc" },
  });
  const data = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    area: s.area,
    direccion: s.direccion,
    telefono: s.telefono,
    whatsapp: s.whatsapp,
    horario: s.horario,
    lat: s.lat != null ? Number(s.lat) : null,
    lng: s.lng != null ? Number(s.lng) : null,
    activa: s.activa,
  }));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const b = await req.json();
  const sucursal = await prisma.sucursales.create({
    data: {
      nombre: b.nombre,
      area: b.area ?? null,
      direccion: b.direccion ?? null,
      telefono: b.telefono ?? null,
      horario: b.horario ?? null,
      activa: b.activa ?? true,
    },
  });
  return NextResponse.json(sucursal, { status: 201 });
}
