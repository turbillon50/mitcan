import Image from "next/image";
import { Plus, Pencil, Beef } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import ImageUpload from "@/components/admin/ImageUpload";
import ExportCsv from "@/components/admin/ExportCsv";
import { saveProducto, deleteProducto } from "../actions";

export const dynamic = "force-dynamic";

type Prod = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria_id: number | null;
  precio: unknown;
  unidad: string | null;
  imagen_url: string | null;
  activo: boolean | null;
};
type Cat = { id: number; nombre: string };

function Fields({ p, cats }: { p?: Prod; cats: Cat[] }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div>
        <label className="label">Nombre</label>
        <input name="nombre" defaultValue={p?.nombre ?? ""} className="input" required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <input name="descripcion" defaultValue={p?.descripcion ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoría</label>
          <select name="categoria_id" defaultValue={p?.categoria_id ?? ""} className="input">
            <option value="">— Sin categoría —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unidad</label>
          <input name="unidad" defaultValue={p?.unidad ?? "kg"} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Precio (MXN)</label>
        <input
          name="precio"
          type="number"
          step="0.01"
          min="0"
          defaultValue={p ? Number(p.precio) : ""}
          className="input"
          required
        />
      </div>
      <ImageUpload defaultUrl={p?.imagen_url} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={p?.activo ?? true} />
        Disponible
      </label>
    </>
  );
}

export default async function AdminProductos() {
  const [productos, cats] = await Promise.all([
    prisma.productos
      .findMany({ include: { categoria: true }, orderBy: { id: "asc" } })
      .catch(() => []),
    prisma.categorias.findMany({ orderBy: { orden: "asc" } }).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Productos</h1>
          <p className="text-sm text-on-bg-muted">{productos.length} productos</p>
        </div>
        <div className="flex gap-2">
          <ExportCsv
            filename="productos"
            rows={productos.map((p) => ({
              nombre: p.nombre,
              categoria: p.categoria?.nombre ?? "",
              precio: Number(p.precio),
              unidad: p.unidad ?? "",
              disponible: p.activo ? "sí" : "no",
            }))}
          />
          <FormDialog
            title="Nuevo producto"
            triggerLabel={
              <>
                <Plus size={16} /> Nuevo
              </>
            }
            action={saveProducto}
          >
            <Fields cats={cats} />
          </FormDialog>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                      {p.imagen_url ? (
                        <Image
                          src={p.imagen_url}
                          alt={p.nombre}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Beef size={18} className="text-primary/50" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.categoria?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatMXN(Number(p.precio))}
                  <span className="text-xs text-on-bg-muted"> /{p.unidad ?? "kg"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`chip text-xs ${p.activo ? "chip-active" : ""}`}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FormDialog
                      title="Editar producto"
                      triggerLabel={<Pencil size={16} />}
                      triggerClass="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2 hover:text-primary"
                      action={saveProducto}
                    >
                      <Fields p={p as unknown as Prod} cats={cats} />
                    </FormDialog>
                    <DeleteButton action={deleteProducto.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
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
