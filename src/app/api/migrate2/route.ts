import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY: add inventario.fuente. Removed after run.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const KEY = "csn-mig2-2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const out: Record<string, string> = {};
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE inventario ADD COLUMN IF NOT EXISTS fuente text DEFAULT 'manual';`
    );
    out.fuente = "ok";
  } catch (e) {
    out.fuente = "err: " + String((e as Error)?.message ?? e);
  }
  return NextResponse.json(out);
}
