import PublicHeader from "@/components/PublicHeader";
import BottomNav from "@/components/BottomNav";
import CatalogClient from "./CatalogClient";
import { getCategorias, getProductosConCategoria } from "@/lib/data";
import { serialize } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [productos, categorias, locale] = await Promise.all([
    getProductosConCategoria({ soloActivos: true }),
    getCategorias(),
    getLocale(),
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
      imagenes: Array.isArray(p.imagenes)
        ? (p.imagenes as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
      es_nuevo: p.es_nuevo,
      categoria_id: p.categoria_id,
      categoria: p.categoria
        ? { id: p.categoria.id, nombre: p.categoria.nombre, slug: p.categoria.slug, icono: p.categoria.icono }
        : null,
    }))
  );
  const cats = categorias.map((c) => ({ id: c.id, nombre: c.nombre, icono: c.icono }));

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="section-title mb-6 text-3xl">{t(locale, "cat.title")}</h1>
        <CatalogClient productos={data} categorias={cats} />
      </main>
      <BottomNav />
    </div>
  );
}
