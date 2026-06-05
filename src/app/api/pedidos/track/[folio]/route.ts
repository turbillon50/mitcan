import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, isStaff } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";
import { serialize } from "@/lib/format";

// GET — dueño del pedido (o staff): estado + timeline + entrega + encuesta.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ folio: string }> }
) {
  const { folio } = await params;
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await ensureOnlineSchema();
  const pedido = await prisma.pedidos.findFirst({
    where: { folio },
    include: {
      items: { include: { producto: true } },
      eventos: { orderBy: { created_at: "asc" } },
      encuesta: true,
    },
  });
  if (!pedido || (pedido.user_id !== user.id && !isStaff(user.rol))) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  return NextResponse.json(serialize(pedido));
}
