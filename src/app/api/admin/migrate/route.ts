import { NextResponse } from "next/server";
import { ensureOnlineSchema } from "@/lib/online";

export const dynamic = "force-dynamic";

// Idempotente e inofensivo (solo ADD COLUMN/CREATE TABLE IF NOT EXISTS),
// por eso puede ejecutarse sin sesión: bootstrap del esquema del módulo.
export async function GET() {
  try {
    await ensureOnlineSchema();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
