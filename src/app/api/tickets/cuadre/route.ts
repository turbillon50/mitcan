import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser, isStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/tickets/cuadre?fecha=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !isStaff(user.rol))
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get("fecha");
    const fecha = fechaParam ?? new Date().toISOString().slice(0, 10);
    const desde = `${fecha} 00:00:00`;
    const hasta = `${fecha} 23:59:59`;

    // Conteos por estado
    const conteos = await prisma.$queryRawUnsafe<{ estado: string; n: bigint; monto: number }[]>(
      `SELECT estado, COUNT(*) as n, COALESCE(SUM(monto),0) as monto
       FROM tickets WHERE created_at BETWEEN $1 AND $2 GROUP BY estado`,
      desde, hasta
    );

    const c = (e: string) => Number(conteos.find(x => x.estado === e)?.n ?? 0);
    const m = (e: string) => Number(conteos.find(x => x.estado === e)?.monto ?? 0);

    const tickets_vitrina = c("vitrina");
    const tickets_despachados = c("despachado");
    const tickets_pagados = c("pagado") + c("entregado");
    const tickets_entregados = c("entregado");
    const tickets_invalidos = c("invalido");
    const total_generados = tickets_vitrina + tickets_despachados + c("pagado") + tickets_entregados + tickets_invalidos;
    const monto_pagado = m("pagado") + m("entregado");

    // === LAS 6 SEÑALES DE ALARMA ===
    const alarmas: { tipo: string; nivel: string; mensaje: string; cantidad: number }[] = [];

    // 1. Tickets atorados en vitrina (salieron pero no se cobraron)
    if (tickets_vitrina > 0) {
      alarmas.push({
        tipo: "vitrina_sin_avanzar", nivel: "alta",
        mensaje: `${tickets_vitrina} ticket(s) salieron de vitrina pero nunca se cobraron`,
        cantidad: tickets_vitrina,
      });
    }

    // 2. Tickets pagados sin verificar salida
    const pagadosSinSalida = c("pagado");
    if (pagadosSinSalida > 0) {
      alarmas.push({
        tipo: "pagado_sin_salida", nivel: "media",
        mensaje: `${pagadosSinSalida} ticket(s) pagados sin verificar en salida`,
        cantidad: pagadosSinSalida,
      });
    }

    // 3. Mismo empleado en 2+ puntos (detectado por la anomalía)
    const mismoEmpleado = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT COUNT(*) as n FROM tickets
       WHERE created_at BETWEEN $1 AND $2
       AND anomalia IN ('mismo_empleado_2_puntos','cajero_revisa_salida')`,
      desde, hasta
    );
    const nMismo = Number(mismoEmpleado[0]?.n ?? 0);
    if (nMismo > 0) {
      alarmas.push({
        tipo: "mismo_empleado_2_puntos", nivel: "alta",
        mensaje: `${nMismo} intento(s) de un mismo empleado controlando 2 puntos del ticket`,
        cantidad: nMismo,
      });
    }

    // 4. Exceso de tickets inválidos (más del 5% del total)
    if (total_generados > 0 && tickets_invalidos / total_generados > 0.05) {
      alarmas.push({
        tipo: "exceso_invalidos", nivel: "alta",
        mensaje: `${tickets_invalidos} tickets inválidos (${Math.round(tickets_invalidos/total_generados*100)}% del día)`,
        cantidad: tickets_invalidos,
      });
    }

    // 5. Diferencia caja vs sistema (del cierre, si existe)
    const cierre = await prisma.$queryRawUnsafe<{ efectivo_contado: number; diferencia: number }[]>(
      `SELECT efectivo_contado, diferencia FROM cierres_caja
       WHERE fecha = $1 ORDER BY created_at DESC LIMIT 1`,
      fecha
    );
    const diferenciaCaja = cierre.length ? Number(cierre[0].diferencia) : null;
    if (diferenciaCaja !== null && Math.abs(diferenciaCaja) > 0) {
      alarmas.push({
        tipo: "diferencia_caja", nivel: "critica",
        mensaje: diferenciaCaja < 0
          ? `Faltan $${Math.abs(diferenciaCaja).toFixed(2)} en la caja vs el sistema`
          : `Sobran $${diferenciaCaja.toFixed(2)} en la caja vs el sistema`,
        cantidad: Math.abs(diferenciaCaja),
      });
    }

    // 6. Cuadre de conteos (vitrina = pagados = entregados idealmente)
    const cuadraConteos = (tickets_vitrina === 0 && pagadosSinSalida === 0);

    // Semáforo general
    const tieneCritica = alarmas.some(a => a.nivel === "critica");
    const tieneAlta = alarmas.some(a => a.nivel === "alta");
    const semaforo = tieneCritica ? "rojo" : tieneAlta ? "amarillo" : (alarmas.length > 0 ? "amarillo" : "verde");

    return NextResponse.json({
      fecha,
      semaforo,
      conteos: {
        total_generados,
        tickets_vitrina,
        tickets_despachados,
        tickets_pagados,
        tickets_entregados,
        tickets_invalidos,
      },
      montos: {
        pagado_sistema: monto_pagado,
        efectivo_contado: cierre.length ? Number(cierre[0].efectivo_contado) : null,
        diferencia: diferenciaCaja,
      },
      cuadra_conteos: cuadraConteos,
      alarmas,
    });
  } catch (err) {
    console.error("[GET /api/tickets/cuadre]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
