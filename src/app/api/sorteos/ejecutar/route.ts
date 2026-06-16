import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { sendPushToAll, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// POST /api/sorteos/ejecutar — ejecutar sorteo con numero ganador aleatorio
export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.rol !== "admin")
      return NextResponse.json({ error: "Solo admins" }, { status: 403 });

    const { sorteo_id } = await req.json();

    // Obtener max numero_cliente registrado
    const maxRow = await prisma.$queryRawUnsafe<{max:number}[]>(
      `SELECT MAX(numero_cliente) as max FROM users WHERE rol = 'cliente'`
    );
    const maxNum = Number(maxRow[0]?.max ?? 0);
    if (maxNum < 1) return NextResponse.json({ error: "No hay clientes registrados" }, { status: 400 });

    // Sorteo: numero aleatorio entre 1 y maxNum
    const ganador = Math.floor(Math.random() * maxNum) + 1;

    // Buscar usuario con ese numero_cliente
    const ganadorRow = await prisma.$queryRawUnsafe<{id:string;nombre:string|null;email:string|null}[]>(
      `SELECT id, nombre, email FROM users WHERE numero_cliente = $1`, ganador
    );

    const ganadorUser = ganadorRow[0] ?? null;

    // Actualizar sorteo
    await prisma.$executeRawUnsafe(
      `UPDATE sorteos SET estado='ejecutado', numero_ganador=$1, user_ganador_id=$2, fecha_sorteo=now() WHERE id=$3`,
      ganador, ganadorUser?.id ?? null, sorteo_id
    );

    // Push al ganador
    if (ganadorUser?.id) {
      await sendPushToUser(ganadorUser.id, {
        title: "🏆 ¡GANASTE el sorteo!",
        body: "Eres el cliente ganador. Preséntate en cualquier sucursal CSN con tu identificación.",
        url: "/app/dashboard",
      }).catch(() => null);
    }

    // Push masivo — todos se enteran
    const sorteoRow = await prisma.$queryRawUnsafe<{titulo:string;premio:string}[]>(
      `SELECT titulo, premio FROM sorteos WHERE id=$1`, sorteo_id
    );
    await sendPushToAll({
      title: `🎊 Ganador del ${sorteoRow[0]?.titulo ?? "sorteo"}: Cliente #${String(ganador).padStart(5,"0")}`,
      body: `Premio: ${sorteoRow[0]?.premio ?? ""}. ¡Gracias a todos por participar!`,
      url: "/app/recompensas",
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      numero_ganador: ganador,
      ganador_nombre: ganadorUser?.nombre ?? null,
      ganador_id: ganadorUser?.id ?? null,
    });
  } catch (err) {
    console.error("[ejecutar sorteo]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
