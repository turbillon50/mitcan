import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY introspection endpoint — used once to reconcile the Prisma schema
// with the live Neon database, then removed before merging to main.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "csn-introspect-2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    const constraints = await prisma.$queryRawUnsafe(`
      SELECT tc.constraint_type, tc.table_name, kcu.column_name,
             ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
      ORDER BY tc.table_name
    `);

    const enums = await prisma.$queryRawUnsafe(`
      SELECT t.typname AS enum_name, e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `);

    const counts = await prisma.$queryRawUnsafe(`
      SELECT relname AS table_name, n_live_tup AS approx_rows
      FROM pg_stat_user_tables
      ORDER BY relname
    `);

    return NextResponse.json(
      { columns, constraints, enums, counts },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message ?? err) },
      { status: 500 }
    );
  }
}
