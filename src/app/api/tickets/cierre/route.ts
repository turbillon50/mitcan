import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, isStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/tickets/cierre — registra el efectivo contado y calcula diferencia
export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !isStaff(user.rol))
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { efectivo_contado, sucursal_id, notas } = await req.json();
    if (efectivo_contado == null || isNaN(Number(efectivo_contado)))
      return NextResponse.json({ error: "Falta el efectivo contado" }, { status: 400 });

    const fecha = new Date().toISOString().slice(0, 10);
    const desde = `${fecha} 00:00:00`;
    const hasta = `${fecha} 23:59:59`;

    // Total cobrado según el sistema
    const totalRows = await prisma.$queryRawUnsafe<{ total: number; n: bigint }[]>(
      `SELECT COALESCE(SUM(monto),0) as total, COUNT(*) as n
       FROM tickets WHERE created_at BETWEEN $1 AND $2 AND estado IN ('pagado','entregado')`,
      desde, hasta
    );
    const totalSistema = Number(totalRows[0]?.total ?? 0);

    // Conteos
    const conteos = await prisma.$queryRawUnsafe<{ estado: string; n: bigint }[]>(
      `SELECT estado, COUNT(*) as n FROM tickets WHERE created_at BETWEEN $1 AND $2 GROUP BY estado`,
      desde, hasta
    );
    const cc = (e: string) => Number(conteos.find(x => x.estado === e)?.n ?? 0);

    const diferencia = Number(efectivo_contado) - totalSistema;

    await prisma.$executeRawUnsafe(
      `INSERT INTO cierres_caja
       (fecha, sucursal_id, cajero_id, efectivo_contado, total_sistema, diferencia,
        tickets_vitrina, tickets_pagados, tickets_entregados, notas, cerrado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      fecha, sucursal_id ?? null, user.id,
      Number(efectivo_contado), totalSistema, diferencia,
      cc("vitrina"), cc("pagado") + cc("entregado"), cc("entregado"),
      notas ?? null, user.id
    );

    return NextResponse.json({
      ok: true,
      total_sistema: totalSistema,
      efectivo_contado: Number(efectivo_contado),
      diferencia,
      cuadra: diferencia === 0,
    });
  } catch (err) {
    console.error("[POST /api/tickets/cierre]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
