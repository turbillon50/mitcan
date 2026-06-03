import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffOrNull } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const sucursal = searchParams.get("sucursal");
  const sucursalId = sucursal ? parseInt(sucursal) : null;

  const productos = await prisma.productos.findMany({
    where: all ? undefined : { activo: true },
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });

  // Apply per-branch price overrides when a sucursal is provided.
  let overrides: Record<number, number> = {};
  if (sucursalId) {
    const precios = await prisma.precios_sucursal.findMany({
      where: { sucursal_id: sucursalId, activo: true },
    });
    overrides = Object.fromEntries(
      precios.filter((p) => p.precio != null).map((p) => [p.producto_id, Number(p.precio)])
    );
  }

  const data = productos.map((p) => ({
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoria: p.categoria?.nombre ?? null,
    precio_base: Number(p.precio),
    precio: overrides[p.id] ?? Number(p.precio),
    unidad: p.unidad,
    es_nuevo: p.es_nuevo,
    imagen_url: p.imagen_url,
    activo: p.activo,
  }));

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const staff = await getStaffOrNull();
  if (!staff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const b = await req.json();
  const nombre: string = b.nombre ?? "Producto";
  const slug =
    (b.slug as string) ||
    nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
    `producto-${Date.now()}`;
  const producto = await prisma.productos.create({
    data: {
      nombre,
      slug,
      descripcion: b.descripcion ?? null,
      categoria_id: b.categoria_id ?? null,
      precio: b.precio ?? 0,
      unidad: b.unidad ?? "kg",
      imagen_url: b.imagen_url ?? null,
      activo: b.activo ?? true,
    },
  });
  return NextResponse.json(producto, { status: 201 });
}
