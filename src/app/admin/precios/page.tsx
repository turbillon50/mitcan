import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS } from "@/lib/data";
import PreciosMatrix from "@/components/admin/PreciosMatrix";

export const dynamic = "force-dynamic";

const AREAS = Object.keys(AREA_LABELS);

export default async function AdminPrecios({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const sp = await searchParams;
  const area = sp.area && AREAS.includes(sp.area) ? sp.area : "tepic";

  const [productos, sucursales] = await Promise.all([
    prisma.productos
      .findMany({ where: { activo: true }, orderBy: { nombre: "asc" } })
      .catch(() => []),
    prisma.sucursales
      .findMany({ where: { activa: true, area }, orderBy: { id: "asc" } })
      .catch(() => []),
  ]);

  const sucIds = sucursales.map((s) => s.id);
  const prodIds = productos.map((p) => p.id);
  const precios = await prisma.precios_sucursal
    .findMany({
      where: { sucursal_id: { in: sucIds }, producto_id: { in: prodIds } },
    })
    .catch(() => []);

  const overrides: Record<string, number> = {};
  for (const pr of precios) {
    if (pr.precio != null) overrides[`${pr.producto_id}_${pr.sucursal_id}`] = Number(pr.precio);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Precios por sucursal</h1>
        <p className="text-sm text-on-bg-muted">
          Edita el precio especial por sucursal · filtra por área
        </p>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {AREAS.map((a) => (
          <Link
            key={a}
            href={`/admin/precios?area=${a}`}
            className={`chip whitespace-nowrap ${area === a ? "chip-active" : ""}`}
          >
            {AREA_LABELS[a]}
          </Link>
        ))}
      </div>

      {sucursales.length === 0 || productos.length === 0 ? (
        <p className="card p-10 text-center text-on-bg-muted">
          No hay productos o sucursales en esta área.
        </p>
      ) : (
        <PreciosMatrix
          productos={productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            base: Number(p.precio),
            unidad: p.unidad ?? "kg",
          }))}
          sucursales={sucursales.map((s) => ({ id: s.id, nombre: s.nombre }))}
          overrides={overrides}
        />
      )}
    </div>
  );
}
