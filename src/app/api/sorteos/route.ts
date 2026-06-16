import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { sendPushToAll, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

// POST /api/sorteos — crear sorteo
export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.rol !== "admin")
      return NextResponse.json({ error: "Solo admins" }, { status: 403 });
    const b = await req.json();
    const rows = await prisma.$queryRawUnsafe<{id:number}[]>(`
      INSERT INTO sorteos (titulo, premio, estado, fecha_sorteo)
      VALUES ($1, $2, 'programado', $3)
      RETURNING id
    `, b.titulo, b.premio, b.fecha_sorteo ?? null);
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// GET /api/sorteos — listar sorteos
export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<Record<string,unknown>[]>(
      `SELECT s.*, u.nombre as ganador_nombre FROM sorteos s
       LEFT JOIN users u ON u.id = s.user_ganador_id
       ORDER BY created_at DESC LIMIT 20`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
