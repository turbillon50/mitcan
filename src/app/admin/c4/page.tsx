import { Radio } from "lucide-react";
import C4Map from "@/components/admin/C4Map";
import { getC4Sucursales } from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";
import { serialize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function C4Page() {
  const [sucursales, token] = await Promise.all([
    getC4Sucursales(),
    Promise.resolve(getMapboxToken()),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Radio size={20} />
        </div>
        <div>
          <h1 className="section-title text-2xl">Centro de control C4</h1>
          <p className="text-sm text-on-bg-muted">
            Mapa en vivo de sucursales · inventario, ventas y (próximamente) cámaras
          </p>
        </div>
      </div>

      <C4Map token={token} sucursales={serialize(sucursales)} />
    </div>
  );
}
