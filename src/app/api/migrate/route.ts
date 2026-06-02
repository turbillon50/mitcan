import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY migration endpoint — applies additive schema changes to the live
// Neon DB (per-branch price + promociones table), then is removed.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "csn-migrate-2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const results: Record<string, string> = {};
  const steps: { name: string; sql: string }[] = [
    {
      name: "inventario.precio",
      sql: `ALTER TABLE inventario ADD COLUMN IF NOT EXISTS precio numeric;`,
    },
    {
      name: "promociones",
      sql: `CREATE TABLE IF NOT EXISTS promociones (
        id serial PRIMARY KEY,
        titulo text NOT NULL,
        descripcion text,
        tipo text DEFAULT 'descuento',
        valor numeric,
        producto_id integer REFERENCES productos(id),
        sucursal_id integer REFERENCES sucursales(id),
        fecha_inicio timestamptz,
        fecha_fin timestamptz,
        imagen_url text,
        activa boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
      );`,
    },
  ];

  for (const step of steps) {
    try {
      await prisma.$executeRawUnsafe(step.sql);
      results[step.name] = "ok";
    } catch (err) {
      results[step.name] = "error: " + String((err as Error)?.message ?? err);
    }
  }

  return new NextResponse(JSON.stringify({ results }, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
