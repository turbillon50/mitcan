import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

// POST { pedido_id } — devuelve los renglones de un pedido anterior del usuario
// con precios ACTUALES, listos para rellenar el carrito (REPETIR MI PEDIDO).
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const pedido = await prisma.pedidos.findUnique({
    where: { id: Number(b.pedido_id) },
    include: { items: { include: { producto: true } } },
  });
  if (!pedido || pedido.user_id !== user.id) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const items = pedido.items
    .filter((it) => it.producto && it.producto.activo)
    .map((it) => ({
      producto_id: it.producto!.id,
      nombre: it.producto!.nombre,
      precio: Number(it.producto!.precio),
      unidad: it.producto!.unidad ?? "kg",
      imagen_url: it.producto!.imagen_url,
      cantidad: Number(it.cantidad),
    }));

  return NextResponse.json({ items });
}
