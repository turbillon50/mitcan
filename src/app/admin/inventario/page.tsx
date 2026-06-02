import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import InventarioCell from "@/components/admin/InventarioCell";

export const dynamic = "force-dynamic";

export default async function AdminInventario({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const sp = await searchParams;
  const sucursales = await prisma.sucursales
    .findMany({ where: { activa: true }, orderBy: { id: "asc" } })
    .catch(() => []);

  const sucursalId = sp.sucursal
    ? parseInt(sp.sucursal)
    : sucursales[0]?.id;

  const [productos, inventario] = await Promise.all([
    prisma.productos
      .findMany({ where: { activo: true }, orderBy: { nombre: "asc" } })
      .catch(() => []),
    sucursalId
      ? prisma.inventario
          .findMany({ where: { sucursal_id: sucursalId } })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const byProd = new Map(inventario.map((i) => [i.producto_id, i]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">Inventario</h1>
        <p className="text-sm text-on-bg-muted">
          Stock por sucursal · {productos.length} productos
        </p>
      </div>

      {/* Sucursal selector */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {sucursales.map((s) => (
          <Link
            key={s.id}
            href={`/admin/inventario?sucursal=${s.id}`}
            className={`chip whitespace-nowrap ${
              sucursalId === s.id ? "chip-active" : ""
            }`}
          >
            {s.nombre}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio base</th>
              <th className="px-4 py-3">Stock en sucursal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {productos.map((p) => {
              const inv = byProd.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 text-on-bg-muted">
                    {formatMXN(Number(p.precio))}
                  </td>
                  <td className="px-4 py-3">
                    {sucursalId ? (
                      <InventarioCell
                        productoId={p.id}
                        sucursalId={sucursalId}
                        stock={Number(inv?.stock ?? 0)}
                        minStock={Number(inv?.min_stock ?? 5)}
                      />
                    ) : (
                      <span className="text-on-bg-muted">
                        Selecciona una sucursal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
