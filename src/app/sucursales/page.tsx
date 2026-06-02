import PublicHeader from "@/components/PublicHeader";
import SucursalesClient from "./SucursalesClient";
import SucursalesMap from "@/components/SucursalesMap";
import { getSucursales, AREA_LABELS } from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const sucursales = await getSucursales({ soloActivas: true });
  const token = getMapboxToken();

  const data = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    area: s.area,
    direccion: s.direccion,
    telefono: s.telefono,
  }));

  // Branches that already have coordinates → map markers.
  const puntos = sucursales
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({
      id: s.id,
      nombre: s.nombre,
      area: s.area,
      direccion: s.direccion,
      telefono: s.telefono,
      lat: Number(s.lat),
      lng: Number(s.lng),
    }));

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
          {sucursales.length} sucursales · Nayarit · Sinaloa · Jalisco
        </p>

        {token && puntos.length > 0 && (
          <div className="mb-8">
            <SucursalesMap token={token} puntos={puntos} />
          </div>
        )}

        <SucursalesClient sucursales={data} areas={areas} />
      </main>
    </div>
  );
}
