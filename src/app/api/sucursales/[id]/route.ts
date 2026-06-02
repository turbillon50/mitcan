import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

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
  const sucursal = await prisma.sucursales.update({
    where: { id: parseInt(id) },
    data: b,
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
