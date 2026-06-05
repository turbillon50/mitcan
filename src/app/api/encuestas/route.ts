import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";

// POST — encuesta post-entrega: { pedido_id, completo: boolean, estrellas: 1-5, comentarios? }
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const pedidoId = Number(b.pedido_id);
  const estrellas = Number(b.estrellas);
  if (!Number.isFinite(pedidoId) || !(estrellas >= 1 && estrellas <= 5)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const pedido = await prisma.pedidos.findUnique({ where: { id: pedidoId } });
  if (!pedido || pedido.user_id !== user.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  await ensureOnlineSchema();
  await prisma.$executeRawUnsafe(
    `INSERT INTO encuestas (pedido_id, user_id, completo, estrellas, comentarios)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (pedido_id) DO UPDATE SET completo = $3, estrellas = $4, comentarios = $5`,
    pedidoId,
    user.id,
    Boolean(b.completo),
    estrellas,
    (b.comentarios ?? "").toString().slice(0, 2000) || null
  );
  return NextResponse.json({ ok: true });
}
