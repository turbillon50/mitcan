import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const producto = await prisma.productos.findUnique({
    where: { id: parseInt(id) },
    include: { categoria: true, inventario: true },
  });
  if (!producto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(producto);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const producto = await prisma.productos.update({
    where: { id: parseInt(id) },
    data: b,
  });
  return NextResponse.json(producto);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  await prisma.productos.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
