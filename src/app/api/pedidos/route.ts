import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, getStaffOrNull } from "@/lib/auth";
import { ENVIO_FIJO, ensureOnlineSchema, registrarEvento, getStockMap } from "@/lib/online";

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
// body: { items: [{producto_id, cantidad}], tipo?: "en_linea", direccion_entrega?, telefono_entrega?, notas?, acepta_total?: boolean }
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await ensureOnlineSchema();

  const b = await req.json();
  const online = b.tipo === "en_linea";
  const reqItems: { producto_id: number; cantidad: number }[] = Array.isArray(b.items)
    ? b.items
        .map((it: { producto_id?: unknown; cantidad?: unknown }) => ({
          producto_id: Number(it.producto_id),
          cantidad: Number(it.cantidad),
        }))
        .filter((it: { producto_id: number; cantidad: number }) =>
          Number.isFinite(it.producto_id) && it.cantidad > 0
        )
    : [];

  if (reqItems.length === 0) {
    return NextResponse.json({ error: "El pedido no tiene productos" }, { status: 400 });
  }

  if (online) {
    if (!b.direccion_entrega?.trim()) {
      return NextResponse.json({ error: "Falta la dirección de entrega" }, { status: 400 });
    }
    if (!b.acepta_total) {
      return NextResponse.json({ error: "Debes aceptar el total del pedido" }, { status: 400 });
    }
  }

  // Precios SIEMPRE desde la DB (nunca confiar en el cliente).
  const ids = reqItems.map((i) => i.producto_id);
  const productos = await prisma.productos.findMany({ where: { id: { in: ids }, activo: true } });
  const porId = new Map(productos.map((p) => [p.id, p]));
  const faltantes = ids.filter((id) => !porId.has(id));
  if (faltantes.length) {
    return NextResponse.json({ error: "Hay productos no disponibles en tu carrito" }, { status: 409 });
  }

  // Validar existencia disponible.
  const stock = await getStockMap(ids);
  for (const it of reqItems) {
    const disp = stock.get(it.producto_id);
    if (disp !== undefined && disp <= 0) {
      return NextResponse.json(
        { error: `Sin existencia: ${porId.get(it.producto_id)?.nombre}` },
        { status: 409 }
      );
    }
  }

  const lineas = reqItems.map((it) => {
    const p = porId.get(it.producto_id)!;
    const precio = Number(p.precio);
    return {
      producto_id: it.producto_id,
      cantidad: it.cantidad,
      precio_unitario: precio,
      subtotal: precio * it.cantidad,
    };
  });

  const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const envio = online ? ENVIO_FIJO : 0;
  const total = subtotal + envio;
  const puntos = Math.floor(total / 10); // 1 punto por cada $10

  const folio = `CSN-${Date.now().toString().slice(-6)}`;

  const pedido = await prisma.pedidos.create({
    data: {
      folio,
      user_id: user.id,
      sucursal_id: b.sucursal_id ?? null,
      estado: online ? "recibido" : "nuevo",
      tipo: online ? "en_linea" : "mostrador",
      subtotal,
      envio,
      total,
      metodo_pago: "contra_entrega",
      direccion_entrega: online ? b.direccion_entrega.trim() : null,
      telefono_entrega: online ? (b.telefono_entrega?.trim() || user.telefono) : null,
      puntos_ganados: puntos,
      notas: b.notas ?? null,
      items: { create: lineas },
    },
    include: { items: true },
  });

  // Guardar dirección/teléfono como predeterminados del cliente.
  if (online) {
    await prisma.users
      .update({
        where: { id: user.id },
        data: {
          direccion: b.direccion_entrega.trim(),
          ...(b.telefono_entrega?.trim() ? { telefono: b.telefono_entrega.trim() } : {}),
        },
      })
      .catch(() => null);
    await registrarEvento(pedido.id, "recibido", { userId: user.id, folio });
  }

  return NextResponse.json(pedido, { status: 201 });
}
