import PublicHeader from "@/components/PublicHeader";
import SucursalesClient from "./SucursalesClient";
import { getSucursales, AREA_LABELS } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const sucursales = await getSucursales({ soloActivas: true });

  const data = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    area: s.area,
    direccion: s.direccion,
    telefono: s.telefono,
  }));

  // Build the area chip list from whatever areas actually exist in the data,
  // preferring the known friendly labels and keeping their canonical order.
  const present = new Set(data.map((s) => s.area).filter(Boolean) as string[]);
  const ordered = Object.keys(AREA_LABELS).filter((k) => present.has(k));
  const extras = [...present].filter((k) => !(k in AREA_LABELS));
  const areas = [...ordered, ...extras].map((key) => ({
    key,
    label: AREA_LABELS[key] ?? key,
  }));

  return (
    <div className="min-h-dvh pb-20">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="section-title mb-2 text-3xl">Sucursales</h1>
        <p className="mb-6 text-on-bg-muted">
          Nayarit · Sinaloa · Jalisco
        </p>
        <SucursalesClient sucursales={data} areas={areas} />
      </main>
    </div>
  );
}
