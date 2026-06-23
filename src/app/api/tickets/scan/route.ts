import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// Flujo de estados del ticket
const FLUJO: Record<string, string> = {
  vitrina: "despachado",   // cajero escanea al cobrar
  despachado: "pagado",    // cajero confirma el pago
  pagado: "entregado",     // revisor de salida verifica
};

// Qué rol puede avanzar a cada estado
const ROL_REQUERIDO: Record<string, string[]> = {
  despachado: ["cajero", "admin", "gerente"],
  pagado: ["cajero", "admin", "gerente"],
  entregado: ["revisor", "admin", "gerente"],
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const rolesOperativos = ["admin", "gerente", "empleado", "vitrinero", "cajero", "revisor"];
    if (!rolesOperativos.includes(user.rol ?? ""))
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { numero, forzar_invalido } = await req.json();
    if (!numero) return NextResponse.json({ error: "Falta número de ticket" }, { status: 400 });

    const rows = await prisma.$queryRawUnsafe<{
      id: number; estado: string; numero: string; user_id: string | null;
      monto: number; vitrinero_id: string | null; cajero_id: string | null; revisor_id: string | null;
    }[]>(
      `SELECT id, estado, numero, user_id, monto, vitrinero_id, cajero_id, revisor_id
       FROM tickets WHERE numero = $1`, numero
    );
    if (!rows.length) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

    const ticket = rows[0];

    // === Marcar inválido (solo gerente/admin o revisor) ===
    if (forzar_invalido) {
      if (!["admin", "gerente", "revisor"].includes(user.rol ?? ""))
        return NextResponse.json({ error: "Solo gerencia o revisor pueden invalidar tickets" }, { status: 403 });
      await prisma.$executeRawUnsafe(
        `UPDATE tickets SET estado='invalido', anomalia='invalidado_manual', anomalia_detectada_at=now(), revisor_id=$1 WHERE id=$2`,
        user.id, ticket.id
      );
      return NextResponse.json({ ok: true, numero, estado_nuevo: "invalido" });
    }

    // === Validar estado terminal ===
    if (ticket.estado === "entregado" || ticket.estado === "invalido")
      return NextResponse.json({ error: `Ticket ya fue procesado (${ticket.estado})` }, { status: 409 });

    const nuevoEstado = FLUJO[ticket.estado];
    if (!nuevoEstado)
      return NextResponse.json({ error: "Estado de ticket inválido" }, { status: 409 });

    // === VALIDACIÓN ANTIFRAUDE: separación de funciones ===
    // El rol del usuario debe poder avanzar a este estado
    const rolesPermitidos = ROL_REQUERIDO[nuevoEstado] ?? [];
    if (!rolesPermitidos.includes(user.rol ?? "")) {
      const nombreRol = nuevoEstado === "entregado" ? "revisor de salida" : "cajero";
      return NextResponse.json({
        error: `Esta acción la debe hacer el ${nombreRol}, no tu rol actual.`,
      }, { status: 403 });
    }

    // REGLA DE ORO: el vitrinero que generó el ticket NO puede cobrarlo ni entregarlo
    if (user.id === ticket.vitrinero_id && !["admin", "gerente"].includes(user.rol ?? "")) {
      // Registrar la anomalía: alguien intentó controlar 2 puntos
      await prisma.$executeRawUnsafe(
        `UPDATE tickets SET anomalia='mismo_empleado_2_puntos', anomalia_detectada_at=now() WHERE id=$1`,
        ticket.id
      );
      return NextResponse.json({
        error: "Quien despacha un ticket no puede cobrarlo ni entregarlo. Otro empleado debe hacerlo.",
        anomalia: true,
      }, { status: 403 });
    }

    // El cajero que cobró NO puede ser el revisor de salida
    if (nuevoEstado === "entregado" && user.id === ticket.cajero_id && !["admin", "gerente"].includes(user.rol ?? "")) {
      await prisma.$executeRawUnsafe(
        `UPDATE tickets SET anomalia='cajero_revisa_salida', anomalia_detectada_at=now() WHERE id=$1`,
        ticket.id
      );
      return NextResponse.json({
        error: "Quien cobró el ticket no puede verificar su salida. El revisor de salida debe hacerlo.",
        anomalia: true,
      }, { status: 403 });
    }

    // === Avanzar el estado con registro de quién y cuándo ===
    let campo = "", campoAt = "";
    if (nuevoEstado === "despachado") { campo = "cajero_id"; campoAt = "caja_at"; }
    else if (nuevoEstado === "pagado") { campo = "cajero_id"; campoAt = "pagado_at"; }
    else if (nuevoEstado === "entregado") { campo = "revisor_id"; campoAt = "salida_at"; }

    await prisma.$executeRawUnsafe(
      `UPDATE tickets SET estado=$1, ${campo}=$2, ${campoAt}=now() WHERE id=$3`,
      nuevoEstado, user.id, ticket.id
    );

    // Notificar al cliente cuando se verifica en salida (entra al sorteo)
    if (nuevoEstado === "entregado" && ticket.user_id) {
      await sendPushToUser(ticket.user_id, {
        title: "¡Ticket verificado! 🎉",
        body: "Tu ticket fue verificado en salida. Ya participas en el sorteo del mes.",
        url: "/app/recompensas",
      }).catch(() => null);
      await prisma.notificaciones.create({
        data: {
          user_id: ticket.user_id,
          titulo: "¡Participas en el sorteo!",
          mensaje: `Ticket ${numero} verificado. ¡Mucha suerte en el sorteo!`,
          tipo: "sorteo",
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, numero, estado_nuevo: nuevoEstado });
  } catch (err) {
    console.error("[POST /api/tickets/scan]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
