import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* TEMP key-gated migration: add productos.imagenes (jsonb) for the gallery.
 * Remove after running. Call: /api/migrate-img?key=csn-img-2026 */
const KEY = "csn-img-2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagenes jsonb;`
    );
    return NextResponse.json({ ok: true, added: "productos.imagenes" });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error)?.message ?? e) },
      { status: 500 }
    );
  }
}
