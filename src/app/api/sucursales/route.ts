import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const sucursales = await prisma.sucursales.findMany({
    where: all ? undefined : { activa: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(sucursales);
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
