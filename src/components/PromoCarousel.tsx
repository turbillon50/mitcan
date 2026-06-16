"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { IconFlame } from "@/components/icons";

type Promo = {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_promo: number | null;
  unidad: string | null;
  todas: boolean;
};

export default function PromoCarousel({ promos }: { promos: Promo[] }) {
  if (promos.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
      {promos.map((p, i) => (
        <motion.article
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="card relative w-[280px] shrink-0 snap-start overflow-hidden"
        >
          <div className="relative h-40 bg-surface-2">
            {p.imagen_url ? (
              <Image src={p.imagen_url} alt={p.titulo} fill sizes="280px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-primary/30">
                <IconFlame size={40} />
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-white">
              Promo
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-bold leading-tight">{p.titulo}</h3>
            {p.descripcion && (
              <p className="mt-1 line-clamp-2 text-xs text-on-bg-muted">{p.descripcion}</p>
            )}
            <div className="mt-3 flex items-end justify-between">
              {p.precio_promo != null ? (
                <span className="font-display text-2xl font-extrabold text-primary">
                  ${p.precio_promo}
                  <span className="text-sm text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
                </span>
              ) : (
                <span />
              )}
              <span className="chip text-[10px]">{p.todas ? "Todas" : "Sucursales sel."}</span>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
