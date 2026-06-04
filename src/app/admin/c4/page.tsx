import { Radio } from "lucide-react";
import C4Map from "@/components/admin/C4Map";
import { getC4Sucursales } from "@/lib/data";
import { getMapboxToken } from "@/lib/mapbox";
import { serialize } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Camara = { nombre: string; url: string };

export default async function C4Page() {
  const [sucursales, token, camBlocks] = await Promise.all([
    getC4Sucursales(),
    Promise.resolve(getMapboxToken()),
    prisma.content_blocks
      .findMany({ where: { key: { startsWith: "c4_cam_" } } })
      .catch(() => []),
  ]);

  // sucursalId -> cámaras
  const camaras: Record<number, Camara[]> = {};
  for (const b of camBlocks) {
    const id = Number(b.key.replace("c4_cam_", ""));
    if (!Number.isFinite(id)) continue;
    const arr = Array.isArray(b.content) ? (b.content as unknown[]) : [];
    camaras[id] = arr
      .map((c) => c as Camara)
      .filter((c) => c && typeof c.url === "string" && c.url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Radio size={20} />
        </div>
        <div>
          <h1 className="section-title text-2xl">Centro de control C4</h1>
          <p className="text-sm text-on-bg-muted">
            Mapa en vivo de sucursales · inventario, ventas y cámaras
          </p>
        </div>
      </div>

      <C4Map token={token} sucursales={serialize(sucursales)} camaras={camaras} />
    </div>
  );
}
