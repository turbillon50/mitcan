import PublicHeader from "@/components/PublicHeader";
import CatalogClient from "./CatalogClient";
import { getCategorias, getProductosConCategoria } from "@/lib/data";
import { serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [productos, categorias] = await Promise.all([
    getProductosConCategoria({ soloActivos: true }),
    getCategorias(),
  ]);

  const data = serialize(
    productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      sku: p.sku,
      descripcion: p.descripcion,
      precio: Number(p.precio),
      unidad: p.unidad,
      imagen_url: p.imagen_url,
      es_nuevo: p.es_nuevo,
      categoria_id: p.categoria_id,
      categoria: p.categoria
        ? { id: p.categoria.id, nombre: p.categoria.nombre, slug: p.categoria.slug, icono: p.categoria.icono }
        : null,
    }))
  );
  const cats = categorias.map((c) => ({ id: c.id, nombre: c.nombre, icono: c.icono }));

  return (
    <div className="min-h-dvh pb-20">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="section-title mb-6 text-3xl">Catálogo</h1>
        <CatalogClient productos={data} categorias={cats} />
      </main>
    </div>
  );
}
