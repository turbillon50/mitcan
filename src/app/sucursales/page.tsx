import PublicHeader from "@/components/PublicHeader";
import SucursalesExplorer from "@/components/SucursalesExplorer";
import { getSucursales, AREA_LABELS } from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const sucursales = await getSucursales({ soloActivas: true });
  const token = getMapboxToken();
  const locale = await getLocale();

  const data = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    area: s.area,
    direccion: s.direccion,
    telefono: s.telefono,
    whatsapp: s.whatsapp,
    horario: s.horario,
    lat: s.lat != null ? Number(s.lat) : null,
    lng: s.lng != null ? Number(s.lng) : null,
  }));

  // Area chips from areas actually present, in canonical order.
  const present = new Set(data.map((s) => s.area).filter(Boolean) as string[]);
  const ordered = Object.keys(AREA_LABELS).filter((k) => present.has(k));
  const extras = [...present].filter((k) => !(k in AREA_LABELS));
  const areas = [...ordered, ...extras].map((key) => ({ key, label: AREA_LABELS[key] ?? key }));

  return (
    <div className="min-h-dvh pb-20">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="section-title mb-2 text-3xl">{t(locale, "suc.title")}</h1>
        <p className="mb-6 text-on-bg-muted">
          {sucursales.length} sucursales · Nayarit · Sinaloa · Jalisco
        </p>
        <SucursalesExplorer token={token} sucursales={data} areas={areas} />
      </main>
    </div>
  );
}
