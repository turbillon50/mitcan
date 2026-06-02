import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import { saveCategoria, deleteCategoria } from "../actions";

export const dynamic = "force-dynamic";

type Cat = {
  id: number;
  nombre: string;
  slug: string;
  icono: string | null;
  orden: number | null;
  activa: boolean | null;
};

function Fields({ c }: { c?: Cat }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div>
        <label className="label">Nombre</label>
        <input name="nombre" defaultValue={c?.nombre ?? ""} className="input" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Slug (opcional)</label>
          <input name="slug" defaultValue={c?.slug ?? ""} className="input" placeholder="se genera solo" />
        </div>
        <div>
          <label className="label">Orden</label>
          <input name="orden" type="number" defaultValue={c?.orden ?? 0} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Icono (Material Symbols / emoji)</label>
        <input name="icono" defaultValue={c?.icono ?? ""} className="input" placeholder="restaurant" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={c?.activa ?? true} />
        Activa
      </label>
    </>
  );
}

export default async function AdminCategorias() {
  const categorias = await prisma.categorias
    .findMany({ orderBy: { orden: "asc" } })
    .catch(() => [] as Cat[]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Categorías</h1>
          <p className="text-sm text-on-bg-muted">{categorias.length} categorías</p>
        </div>
        <FormDialog
          title="Nueva categoría"
          triggerLabel={<><Plus size={16} /> Nueva</>}
          action={saveCategoria}
        >
          <Fields />
        </FormDialog>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {categorias.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-on-bg-muted">{c.orden ?? 0}</td>
                <td className="px-4 py-3 font-medium">{c.nombre}</td>
                <td className="px-4 py-3 text-on-bg-muted">{c.slug}</td>
                <td className="px-4 py-3">
                  <span className={`chip text-xs ${c.activa ? "chip-active" : ""}`}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FormDialog
                      title="Editar categoría"
                      triggerLabel={<Pencil size={16} />}
                      triggerClass="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2 hover:text-primary"
                      action={saveCategoria}
                    >
                      <Fields c={c} />
                    </FormDialog>
                    <DeleteButton action={deleteCategoria.bind(null, c.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
