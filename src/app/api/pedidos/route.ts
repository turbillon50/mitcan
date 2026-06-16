import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, getStaffOrNull } from "@/lib/auth";
import { ENVIO_FIJO, registrarEvento, getStockMap } from "@/lib/online";

export const dynamic = "force-dynamic";
// Vercel: máximo 60s para rutas de API (Pro). Sube si es necesario.
export const maxDuration = 30;

// GET — staff only
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

// POST — crear pedido
export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    let b: Record<string, unknown>;
    try {
      b = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const online = b.tipo === "en_linea";
    const reqItems: { producto_id: number; cantidad: number }[] = Array.isArray(b.items)
      ? (b.items as Array<{ producto_id?: unknown; cantidad?: unknown }>)
          .map((it) => ({
            producto_id: Number(it.producto_id),
            cantidad: Number(it.cantidad),
          }))
          .filter((it) => Number.isFinite(it.producto_id) && it.cantidad > 0)
      : [];

    if (reqItems.length === 0)
      return NextResponse.json({ error: "El pedido no tiene productos" }, { status: 400 });

    if (online) {
      if (!(b.direccion_entrega as string)?.trim())
        return NextResponse.json({ error: "Falta la dirección de entrega" }, { status: 400 });
      if (!b.acepta_total)
        return NextResponse.json({ error: "Debes aceptar el total del pedido" }, { status: 400 });
    }

    const ids = reqItems.map((i) => i.producto_id);
    const productos = await prisma.productos.findMany({ where: { id: { in: ids }, activo: true } });
    const porId = new Map(productos.map((p) => [p.id, p]));
    const faltantes = ids.filter((id) => !porId.has(id));
    if (faltantes.length)
      return NextResponse.json({ error: "Hay productos no disponibles en tu carrito" }, { status: 409 });

    const stock = await getStockMap(ids);
    for (const it of reqItems) {
      const disp = stock.get(it.producto_id);
      if (disp !== undefined && disp <= 0)
        return NextResponse.json(
          { error: `Sin existencia: ${porId.get(it.producto_id)?.nombre}` },
          { status: 409 }
        );
    }

    const lineas = reqItems.map((it) => {
      const p = porId.get(it.producto_id)!;
      const precio = Number(p.precio);
      return { producto_id: it.producto_id, cantidad: it.cantidad, precio_unitario: precio, subtotal: precio * it.cantidad };
    });

    const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
    const envio = online ? ENVIO_FIJO : 0;
    const total = subtotal + envio;
    const puntos = Math.floor(total / 10);
    const folio = `CSN-${Date.now().toString().slice(-6)}`;

    const pedido = await prisma.pedidos.create({
      data: {
        folio,
        user_id: user.id,
        sucursal_id: (b.sucursal_id as number) ?? null,
        estado: online ? "recibido" : "nuevo",
        tipo: online ? "en_linea" : "mostrador",
        subtotal,
        envio,
        total,
        metodo_pago: "contra_entrega",
        direccion_entrega: online ? (b.direccion_entrega as string).trim() : null,
        telefono_entrega: online ? ((b.telefono_entrega as string)?.trim() || user.telefono) : null,
        puntos_ganados: puntos,
        notas: (b.notas as string) ?? null,
        items: { create: lineas },
      },
      include: { items: true },
    });

    if (online) {
      await prisma.users
        .update({
          where: { id: user.id },
          data: {
            direccion: (b.direccion_entrega as string).trim(),
            ...((b.telefono_entrega as string)?.trim() ? { telefono: (b.telefono_entrega as string).trim() } : {}),
          },
        })
        .catch(() => null);
      // Fire-and-forget: no bloquea la respuesta
      registrarEvento(pedido.id, "recibido", { userId: user.id, folio }).catch(() => null);
    }

    return NextResponse.json({ folio: pedido.folio, id: pedido.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json(
      { error: "Error interno al crear el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
