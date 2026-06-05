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
// Precios SIEMPRE recalculados en servidor desde DB (override por sucursal),
// nunca se confía en el precio enviado por el cliente.
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const rawItems: { producto_id: number; cantidad: number }[] = Array.isArray(b.items)
    ? b.items
    : [];

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "El pedido no tiene productos" }, { status: 400 });
  }

  const sucursalId =
    b.sucursal_id != null && Number.isFinite(Number(b.sucursal_id))
      ? Number(b.sucursal_id)
      : null;

  // Normaliza y valida cantidades; consolida duplicados.
  const wanted = new Map<number, number>();
  for (const it of rawItems) {
    const pid = Number(it.producto_id);
    const qty = Number(it.cantidad);
    if (!Number.isInteger(pid) || pid <= 0) {
      return NextResponse.json({ error: "Producto inválido en el pedido" }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json(
        { error: "La cantidad debe ser de al menos 1" },
        { status: 400 }
      );
    }
    wanted.set(pid, (wanted.get(pid) ?? 0) + Math.floor(qty));
  }

  const ids = [...wanted.keys()];

  // Carga productos reales y overrides de precio por sucursal.
  const [productos, overrides] = await Promise.all([
    prisma.productos.findMany({ where: { id: { in: ids } } }),
    sucursalId != null
      ? prisma.precios_sucursal.findMany({
          where: { producto_id: { in: ids }, sucursal_id: sucursalId, activo: true },
        })
      : Promise.resolve([] as { producto_id: number; precio: unknown }[]),
  ]);

  const prodById = new Map(productos.map((p) => [p.id, p]));
  const overrideById = new Map(overrides.map((o) => [o.producto_id, o.precio]));

  // Construye items con precio de servidor; valida existencia y disponibilidad.
  const lineItems: {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[] = [];

  for (const [pid, qty] of wanted) {
    const prod = prodById.get(pid);
    if (!prod) {
      return NextResponse.json({ error: `Producto ${pid} no existe` }, { status: 404 });
    }
    if (prod.activo === false) {
      return NextResponse.json(
        { error: `Producto no disponible: ${prod.nombre}` },
        { status: 409 }
      );
    }
    const ov = overrideById.get(pid);
    const precio = Number(ov != null ? ov : prod.precio);
    lineItems.push({
      producto_id: pid,
      cantidad: qty,
      precio_unitario: precio,
      subtotal: precio * qty,
    });
  }

  const subtotal = lineItems.reduce((acc, it) => acc + it.subtotal, 0);
  const total = subtotal; // shipping/discounts could be applied here
  const puntos = Math.floor(total / 10); // 1 punto por cada $10

  // Folio con entropía suficiente para evitar colisiones bajo concurrencia.
  const folio = `MTC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

  const pedido = await prisma.pedidos.create({
    data: {
      folio,
      user_id: user.id,
      sucursal_id: sucursalId,
      estado: "nuevo",
      subtotal,
      total,
      puntos_ganados: puntos,
      notas: b.notas ?? null,
      items: { create: lineItems },
    },
    include: { items: true },
  });

  return NextResponse.json(pedido, { status: 201 });
}
