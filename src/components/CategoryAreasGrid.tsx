import Image from "next/image";
import Link from "next/link";
import { categoryTint, productImage } from "@/lib/catalogo-img";
import { IconArrowRight } from "@/components/icons";

export type CategoryArea = {
  id: number;
  nombre: string;
  slug: string | null;
  icono: string | null;
  productos_count?: number;
};

function categoryKey(categoria: CategoryArea) {
  return categoria.slug || String(categoria.id);
}

export default function CategoryAreasGrid({
  categorias,
  activeCategoria,
}: {
  categorias: CategoryArea[];
  activeCategoria?: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categorias.map((categoria) => {
        const key = categoryKey(categoria);
        const href = `/catalogo?categoria=${encodeURIComponent(key)}`;
        const photo = productImage(null, categoria.nombre);
        const tint = categoryTint(categoria.nombre);
        const active = activeCategoria === key || activeCategoria === String(categoria.id);
        const count = categoria.productos_count ?? 0;

        return (
          <Link
            key={categoria.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`card group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/30 ${
              active ? "border-primary/50 ring-1 ring-primary/20" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
              {photo ? (
                <Image
                  src={photo}
                  alt={categoria.nombre}
                  fill
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-4xl text-white"
                  style={{ background: `linear-gradient(135deg, ${tint.from}, ${tint.to})` }}
                >
                  {categoria.icono ?? "CSN"}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              {categoria.icono && photo && (
                <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/45 text-xl text-white backdrop-blur">
                  {categoria.icono}
                </span>
              )}
            </div>
            <div className="flex min-h-[104px] flex-col justify-between p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-bg-muted">
                  Area de categoria
                </p>
                <h3 className="mt-1 line-clamp-2 text-base font-bold leading-tight">
                  {categoria.nombre}
                </h3>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-on-bg-muted">
                  {count} {count === 1 ? "producto" : "productos"}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <IconArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
