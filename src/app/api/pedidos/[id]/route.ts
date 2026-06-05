import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, getStaffOrNull, isStaff } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// Estados válidos del ciclo de vida de un pedido.
const ESTADOS = [
  "nuevo",
  "confirmado",
  "preparando",
  "en_camino",
  "entregado",
  "cancelado",
] as const;

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
  const pedidoId = parseInt(id);
  if (!Number.isInteger(pedidoId)) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const b = await req.json().catch(() => ({}));

  // Estado actual para detectar transiciones (evita acreditar puntos dos veces).
  const actual = await prisma.pedidos.findUnique({ where: { id: pedidoId } });
  if (!actual) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof b.estado === "string") {
    if (!ESTADOS.includes(b.estado as (typeof ESTADOS)[number])) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    data.estado = b.estado;
  }
  if (typeof b.notas === "string") data.notas = b.notas;

  const pedido = await prisma.pedidos.update({ where: { id: pedidoId }, data });

  // Acredita puntos solo en la TRANSICIÓN a "entregado" (no si ya estaba entregado).
  const ganados = pedido.puntos_ganados ?? 0;
  const transicionAEntregado =
    b.estado === "entregado" && actual.estado !== "entregado";
  if (transicionAEntregado && pedido.user_id && ganados > 0) {
    await prisma.users
      .update({
        where: { id: pedido.user_id },
        data: { puntos: { increment: ganados } },
      })
      .catch(() => null);
  }

  return NextResponse.json(pedido);
}
