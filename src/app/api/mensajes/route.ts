import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth";
import {
  getThread,
  enviarMensajeCliente,
  marcarLeidos,
} from "@/lib/mensajes";

export const dynamic = "force-dynamic";

// GET — hilo del cliente autenticado (y lo marca como leído).
export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const mensajes = await getThread(user.id);
  await marcarLeidos(user.id, "cliente").catch(() => null);
  return NextResponse.json({ mensajes });
}

// POST — el cliente envía un mensaje a la tienda.
export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const cuerpo = typeof body.cuerpo === "string" ? body.cuerpo : "";
  if (!cuerpo.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 422 });
  }
  const msg = await enviarMensajeCliente(user.id, cuerpo, user.nombre ?? null);
  return NextResponse.json({ ok: true, id: msg?.id }, { status: 201 });
}
