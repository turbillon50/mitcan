import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const productos = await prisma.productos.findMany({
    where: all ? undefined : { activo: true },
    include: { categoria: true },
    orderBy: [{ destacado: "desc" }, { nombre: "asc" }],
  });
  return NextResponse.json(productos);
}

export async function POST(req: Request) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const b = await req.json();
  const producto = await prisma.productos.create({
    data: {
      nombre: b.nombre,
      descripcion: b.descripcion ?? null,
      categoria_id: b.categoria_id ?? null,
      precio: b.precio ?? 0,
      unidad: b.unidad ?? "kg",
      imagen_url: b.imagen_url ?? null,
      destacado: !!b.destacado,
      activo: b.activo ?? true,
    },
  });
  return NextResponse.json(producto, { status: 201 });
}
