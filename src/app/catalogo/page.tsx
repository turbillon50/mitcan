import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import BottomNav from "@/components/BottomNav";
import CategoryAreasGrid from "@/components/CategoryAreasGrid";
import CatalogClient from "./CatalogClient";
import { getCategoriasConConteoProductos, getProductosConCategoria } from "@/lib/data";
import { serialize } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type CatalogoPageProps = {
  searchParams?: Promise<{
    categoria?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const params = await searchParams;
  const selectedParam = firstParam(params?.categoria);

  const [categorias, locale] = await Promise.all([
    getCategoriasConConteoProductos({ soloActivas: true, soloProductosActivos: true }),
    getLocale(),
  ]);

  const selectedCategory =
    selectedParam != null
      ? categorias.find((c) => c.slug === selectedParam || String(c.id) === selectedParam) ?? null
      : null;

  const productos = selectedCategory
    ? await getProductosConCategoria({ soloActivos: true, categoriaId: selectedCategory.id })
    : [];

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
  const cats = serialize(
    categorias.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      icono: c.icono,
      productos_count: c.productos_count,
    }))
  );
  const selectedKey = selectedCategory?.slug || (selectedCategory ? String(selectedCategory.id) : null);
  const selected = selectedCategory
    ? {
        id: selectedCategory.id,
        nombre: selectedCategory.nombre,
        slug: selectedCategory.slug,
        icono: selectedCategory.icono,
      }
    : null;

  return (
    <div className="min-h-dvh pb-24 lg:pb-8">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <h1 className="section-title text-3xl">{t(locale, "cat.title")} por areas</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-bg-muted">
            Cortes, abarrotes, bebidas y complementos organizados por categoria.
          </p>
        </div>

        <CategoryAreasGrid categorias={cats} activeCategoria={selectedKey} />

        {selected ? (
          <section className="mt-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-bg-muted">
                  Productos del area
                </p>
                <h2 className="section-title">{selected.nombre}</h2>
              </div>
              <Link href="/catalogo" className="btn-ghost w-fit px-4 py-2 text-sm">
                Cambiar area
              </Link>
            </div>
            <CatalogClient productos={data} categoria={selected} />
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-hairline bg-surface/60 p-6 text-sm text-on-bg-muted">
            Elige un area de categoria para ver sus productos.
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
