import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

export const runtime = "nodejs";

type Item = { sku: string; cantidad: number; sucursal_id: number; fuente?: string };

/** Batch inventory sync from an external system (or manual).
 *  Auth: staff session OR header `x-csn-sync-key` === CSN_SYNC_KEY. */
export async function POST(req: Request) {
  const key = req.headers.get("x-csn-sync-key");
  const okKey = !!process.env.CSN_SYNC_KEY && key === process.env.CSN_SYNC_KEY;
  if (!okKey) {
    const staff = await getStaffOrNull();
    if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Item[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Se espera un arreglo" }, { status: 400 });
  }

  const diff: {
    sku: string;
    sucursal_id: number;
    antes: number | null;
    ahora: number;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const it of body) {
    try {
      const prod = await prisma.productos.findFirst({ where: { sku: it.sku } });
      if (!prod) {
        diff.push({ sku: it.sku, sucursal_id: it.sucursal_id, antes: null, ahora: it.cantidad, ok: false, error: "SKU no encontrado" });
        continue;
      }
      const existing = await prisma.inventario.findFirst({
        where: { producto_id: prod.id, sucursal_id: it.sucursal_id },
      });
      const antes = existing ? Number(existing.stock ?? 0) : null;
      const fuente = it.fuente ?? "sync_externo";
      if (existing) {
        await prisma.inventario.update({
          where: { id: existing.id },
          data: { stock: it.cantidad, fuente, updated_at: new Date() },
        });
      } else {
        await prisma.inventario.create({
          data: { producto_id: prod.id, sucursal_id: it.sucursal_id, stock: it.cantidad, fuente },
        });
      }
      diff.push({ sku: it.sku, sucursal_id: it.sucursal_id, antes, ahora: it.cantidad, ok: true });
    } catch (e) {
      diff.push({ sku: it.sku, sucursal_id: it.sucursal_id, antes: null, ahora: it.cantidad, ok: false, error: String((e as Error)?.message ?? e) });
    }
  }

  return NextResponse.json({ procesados: diff.length, diff });
}
