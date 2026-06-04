"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, X, Plus, Sparkles } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { productImage, categoryTint } from "@/lib/catalogo-img";
import { useT } from "@/components/I18nProvider";

type Producto = {
  id: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  precio: number;
  unidad: string | null;
  imagen_url: string | null;
  imagenes: string[];
  es_nuevo: boolean | null;
  categoria_id: number | null;
  categoria: { id: number; nombre: string; slug: string | null; icono: string | null } | null;
};
type Categoria = { id: number; nombre: string; icono: string | null };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const PAGE = 48;

export default function CatalogClient({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const [active, setActive] = useState<Producto | null>(null);
  const dq = useDeferredValue(q);
  const t = useT();

  // Precompute a normalized haystack per product once.
  const indexed = useMemo(
    () =>
      productos.map((p) => ({
        p,
        hay: norm(
          `${p.nombre} ${p.sku ?? ""} ${p.descripcion ?? ""} ${p.categoria?.nombre ?? ""}`
        ),
        name: norm(p.nombre),
      })),
    [productos]
  );

  const filtered = useMemo(() => {
    const tokens = norm(dq).split(/\s+/).filter(Boolean);
    let list = indexed;
    if (cat !== "all") list = list.filter((x) => x.p.categoria_id === cat);
    if (tokens.length) {
      list = list.filter((x) => tokens.every((t) => x.hay.includes(t)));
      // Rank: name-prefix > name-includes > other, then alphabetical.
      const first = tokens[0];
      const score = (x: (typeof indexed)[number]) =>
        x.name.startsWith(first) ? 0 : x.name.includes(first) ? 1 : 2;
      list = [...list].sort(
        (a, b) => score(a) - score(b) || a.p.nombre.localeCompare(b.p.nombre)
      );
    }
    return list.map((x) => x.p);
  }, [indexed, dq, cat]);

  // Reset the visible window whenever the query/category changes.
  useEffect(() => setLimit(PAGE), [dq, cat]);

  const shown = filtered.slice(0, limit);

  // Auto-load more as the sentinel scrolls into view.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (limit >= filtered.length) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((l) => l + PAGE);
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [limit, filtered.length]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-bg-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          enterKeyHint="search"
          placeholder={t("cat.searchPlaceholder")}
          className="input px-11"
          aria-label={t("cat.searchPlaceholder")}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-bg-muted hover:bg-surface-2"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => setCat("all")}
          className={`chip whitespace-nowrap ${cat === "all" ? "chip-active" : ""}`}
        >
          {t("cat.all")}
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat((prev) => (prev === c.id ? "all" : c.id))}
            className={`chip whitespace-nowrap ${cat === c.id ? "chip-active" : ""}`}
          >
            {c.icono ? `${c.icono} ` : ""}
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="mb-5 text-sm text-on-bg-muted">
        {filtered.length === productos.length
          ? `${productos.length} ${t("cat.products")}`
          : `${filtered.length} ${filtered.length === 1 ? t("cat.result") : t("cat.results")}`}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-on-bg-muted">{t("cat.noResults")} “{q}”.</p>
          <button onClick={() => { setQ(""); setCat("all"); }} className="btn-ghost mt-4">
            {t("cat.clear")}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => {
              const photo = productImage(p.imagen_url, p.categoria?.nombre);
              const tint = categoryTint(p.categoria?.nombre);
              return (
                <article
                  key={p.id}
                  onClick={() => setActive(p)}
                  className="card group cursor-pointer overflow-hidden transition hover:border-primary/30"
                >
                  <div className="relative h-36 overflow-hidden bg-surface-2">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={p.nombre}
                        fill
                        sizes="(max-width:768px) 50vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full flex-col items-center justify-center text-white"
                        style={{ background: `linear-gradient(135deg, ${tint.from}, ${tint.to})` }}
                      >
                        <span className="text-4xl drop-shadow-sm">
                          {p.categoria?.icono ?? "🥩"}
                        </span>
                        <span className="mt-1 px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/80">
                          {p.categoria?.nombre ?? "CSN"}
                        </span>
                      </div>
                    )}
                    {p.es_nuevo && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        <Sparkles size={10} /> {t("cat.new")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col p-3.5">
                    <p className="text-[11px] uppercase tracking-wide text-on-bg-muted">
                      {p.categoria?.nombre ?? t("cat.product")}
                    </p>
                    <h3 className="font-bold leading-tight line-clamp-2">{p.nombre}</h3>
                    {p.descripcion && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-on-bg-muted">
                        {p.descripcion}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {formatMXN(p.precio)}
                        <span className="text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Plus size={16} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {limit < filtered.length && (
            <div ref={sentinel} className="flex justify-center py-8">
              <button onClick={() => setLimit((l) => l + PAGE)} className="btn-ghost">
                {t("cat.seeMore")} ({filtered.length - limit} {t("cat.remaining")})
              </button>
            </div>
          )}
        </>
      )}

      {active && <ProductModal p={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ProductModal({ p, onClose }: { p: Producto; onClose: () => void }) {
  const t = useT();
  const gallery = p.imagenes.length
    ? p.imagenes
    : [productImage(p.imagen_url, p.categoria?.nombre)].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  const tint = categoryTint(p.categoria?.nombre);
  const cur = gallery[idx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-bg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
          {cur ? (
            <Image src={cur} alt={p.nombre} fill sizes="(max-width:640px) 100vw, 512px" className="object-cover" />
          ) : (
            <div
              className="flex h-full items-center justify-center text-6xl text-white"
              style={{ background: `linear-gradient(135deg, ${tint.from}, ${tint.to})` }}
            >
              {p.categoria?.icono ?? "🥩"}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                onClick={() => setIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                onClick={() => setIdx((i) => (i + 1) % gallery.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
                aria-label="Siguiente"
              >
                ›
              </button>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {gallery.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
          {p.es_nuevo && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow">
              <Sparkles size={11} /> {t("cat.new")}
            </span>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${i === idx ? "border-primary" : "border-hairline"}`}
              >
                <Image src={g} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <p className="text-[11px] uppercase tracking-wide text-on-bg-muted">
            {p.categoria?.nombre ?? t("cat.product")}
          </p>
          <h2 className="mt-0.5 text-xl font-bold">{p.nombre}</h2>
          <p className="mt-2 text-lg font-semibold text-primary">
            {formatMXN(p.precio)}
            <span className="text-sm text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
          </p>
          {p.descripcion && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-on-bg-muted">
              {p.descripcion}
            </p>
          )}
          {p.sku && <p className="mt-3 text-xs text-on-bg-muted">{t("cat.code")}: {p.sku}</p>}
          <a href="/sucursales" className="btn-primary mt-5 w-full justify-center">
            {t("cat.findAtBranch")}
          </a>
        </div>
      </div>
    </div>
  );
}
