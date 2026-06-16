import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { sendPushToAll, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

const ESTADOS = { vitrina: "caja", caja: "salida" } as const;
type EstadoActual = keyof typeof ESTADOS;

// POST /api/tickets/scan — cajero o revisor escanean el QR del ticket
export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !["admin","gerente","empleado"].includes(user.rol ?? ""))
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { numero } = await req.json();
    if (!numero) return NextResponse.json({ error: "Falta número de ticket" }, { status: 400 });

    const rows = await prisma.$queryRawUnsafe<{id:number;estado:string;numero:string;user_id:string|null;monto:number}[]>(
      `SELECT id, estado, numero, user_id, monto FROM tickets WHERE numero = $1`, numero
    );
    if (!rows.length) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

    const ticket = rows[0];
    if (ticket.estado === "salida")
      return NextResponse.json({ error: "Ticket ya fue procesado en salida" }, { status: 409 });

    const estadoActual = ticket.estado as EstadoActual;
    if (!(estadoActual in ESTADOS))
      return NextResponse.json({ error: "Estado de ticket inválido" }, { status: 409 });

    const nuevoEstado = ESTADOS[estadoActual];
    const campo = nuevoEstado === "caja" ? "cajero_id" : "revisor_id";
    const campoAt = nuevoEstado === "caja" ? "caja_at" : "salida_at";

    await prisma.$executeRawUnsafe(
      `UPDATE tickets SET estado=$1, ${campo}=$2, ${campoAt}=now() WHERE id=$3`,
      nuevoEstado, user.id, ticket.id
    );

    // Si llegó a salida: el cliente ya participa en el sorteo
    if (nuevoEstado === "salida" && ticket.user_id) {
      await sendPushToUser(ticket.user_id, {
        title: "¡Estás participando! 🎉",
        body: "Tu ticket fue verificado en salida. Ya participas en el sorteo del mes.",
        url: "/app/recompensas",
      }).catch(() => null);
      await prisma.notificaciones.create({
        data: {
          user_id: ticket.user_id,
          titulo: "¡Estás participando en el sorteo!",
          mensaje: `Ticket ${numero} verificado. ¡Mucha suerte!`,
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
