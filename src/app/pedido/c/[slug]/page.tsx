import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/format";
import { getStockMap } from "@/lib/online";
import ProductosCategoria from "@/components/pedido/ProductosCategoria";

export const dynamic = "force-dynamic";

export default async function CategoriaPedido({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoria = await prisma.categorias
    .findFirst({ where: { slug } })
    .catch(() => null);
  if (!categoria) notFound();

  const productos = await prisma.productos
    .findMany({
      where: { categoria_id: categoria.id, activo: true },
      orderBy: { nombre: "asc" },
    })
    .catch(() => []);

  const stock = await getStockMap(productos.map((p) => p.id)).catch(
    () => new Map<number, number>()
  );

  const data = serialize(
    productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      unidad: p.unidad ?? "kg",
      imagen_url: p.imagen_url,
      es_nuevo: p.es_nuevo ?? false,
      stock: stock.has(p.id) ? stock.get(p.id)! : null, // null = sin registro (se asume disponible)
    }))
  );

  return <ProductosCategoria categoria={categoria.nombre} productos={data} />;
}
