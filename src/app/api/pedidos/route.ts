import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, getStaffOrNull } from "@/lib/auth";

// GET — staff only: list orders (optional ?estado= & ?sucursal=)
export async function GET(req: Request) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") ?? undefined;
  const sucursal = searchParams.get("sucursal");

  const pedidos = await prisma.pedidos.findMany({
    where: {
      estado,
      sucursal_id: sucursal ? parseInt(sucursal) : undefined,
    },
    include: { user: true, sucursal: true, items: { include: { producto: true } } },
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return NextResponse.json(pedidos);
}

// POST — authenticated user: create an order with line items.
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const b = await req.json();
  const items: {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
  }[] = Array.isArray(b.items) ? b.items : [];

  if (items.length === 0) {
    return NextResponse.json({ error: "El pedido no tiene productos" }, { status: 400 });
  }

  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.precio_unitario) * Number(it.cantidad),
    0
  );
  const total = subtotal; // shipping/discounts could be applied here
  const puntos = Math.floor(total / 10); // 1 punto por cada $10

  const folio = `MTC-${Date.now().toString().slice(-6)}`;

  const pedido = await prisma.pedidos.create({
    data: {
      folio,
      user_id: user.id,
      sucursal_id: b.sucursal_id ?? null,
      estado: "nuevo",
      subtotal,
      total,
      puntos_ganados: puntos,
      notas: b.notas ?? null,
      items: {
        create: items.map((it) => ({
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: Number(it.precio_unitario) * Number(it.cantidad),
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(pedido, { status: 201 });
}
