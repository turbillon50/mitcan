import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY: list users and promote one to admin by email. Removed after use.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "csn-promote-2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const email = searchParams.get("email")?.trim().toLowerCase();
  const rol = (searchParams.get("rol") ?? "admin") as
    | "admin"
    | "gerente"
    | "empleado"
    | "cliente";

  let promoted: unknown = null;
  if (email) {
    const res = await prisma.users.updateMany({
      where: { email: { equals: email, mode: "insensitive" } },
      data: { rol },
    });
    promoted = { email, rol, updated: res.count };
  }

  const users = await prisma.users.findMany({
    orderBy: { created_at: "asc" },
    select: { id: true, email: true, nombre: true, rol: true, created_at: true },
  });

  return new NextResponse(
    JSON.stringify({ promoted, count: users.length, users }, null, 2),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
