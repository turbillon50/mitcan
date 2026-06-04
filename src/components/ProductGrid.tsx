"use client";

import Image from "next/image";
import { StaggerContainer, StaggerItem, HoverCard } from "@/components/motion";
import { productImage, categoryTint } from "@/lib/catalogo-img";

type P = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  unidad: string | null;
  imagen_url: string | null;
  categoria: string | null;
  es_nuevo: boolean;
};

export default function ProductGrid({ productos }: { productos: P[] }) {
  return (
    <StaggerContainer className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {productos.map((p) => {
        const photo = productImage(p.imagen_url, p.categoria);
        const tint = categoryTint(p.categoria);
        return (
        <StaggerItem key={p.id}>
          <HoverCard className="card h-full overflow-hidden">
            <div className="relative h-36 bg-surface-2">
              {photo ? (
                <Image src={photo} alt={p.nombre} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${tint.from}, ${tint.to})` }}
                >
                  🥩
                </div>
              )}
              {p.es_nuevo && (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Nuevo
                </span>
              )}
            </div>
            <div className="p-3.5">
              <p className="text-[11px] uppercase tracking-wide text-on-bg-muted">
                {p.categoria ?? "Producto"}
              </p>
              <h3 className="font-bold leading-tight">{p.nombre}</h3>
              <p className="mt-1 text-sm font-semibold text-primary">
                ${p.precio}
                <span className="text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
              </p>
            </div>
          </HoverCard>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
