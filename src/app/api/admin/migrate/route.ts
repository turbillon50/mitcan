import { NextResponse } from "next/server";
import { getStaffOrNull } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";

// POST — fuerza la creación idempotente del esquema del módulo en línea.
export async function POST() {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await ensureOnlineSchema();
  return NextResponse.json({ ok: true });
}
