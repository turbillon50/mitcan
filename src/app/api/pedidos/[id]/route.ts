import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, getStaffOrNull, isStaff } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;

  const pedido = await prisma.pedidos.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { producto: true } }, sucursal: true, user: true },
  });
  if (!pedido) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  // Owners or staff only.
  if (pedido.user_id !== user.id && !isStaff(user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(pedido);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof b.estado === "string") data.estado = b.estado;
  if (typeof b.tipo_entrega === "string") data.tipo_entrega = b.tipo_entrega;
  if (typeof b.direccion === "string") data.direccion = b.direccion;

  const pedido = await prisma.pedidos.update({
    where: { id: parseInt(id) },
    data,
  });

  // When an order is delivered, credit the earned points to the customer.
  if (b.estado === "entregado" && pedido.user_id && pedido.puntos_ganados > 0) {
    await prisma.users
      .update({
        where: { id: pedido.user_id },
        data: { puntos: { increment: pedido.puntos_ganados } },
      })
      .catch(() => null);
  }

  return NextResponse.json(pedido);
}
