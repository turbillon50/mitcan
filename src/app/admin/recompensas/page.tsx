import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import { saveRecompensa, deleteRecompensa } from "../actions";

export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "cupon", label: "Cupón" },
  { value: "descuento", label: "Descuento" },
  { value: "envio", label: "Envío gratis" },
  { value: "producto", label: "Producto" },
];

type Rec = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string | null;
  puntos_requeridos: number;
  imagen_url: string | null;
  valido_hasta: Date | null;
  activa: boolean;
};

function Fields({ r }: { r?: Rec }) {
  return (
    <>
      {r && <input type="hidden" name="id" value={r.id} />}
      <div>
        <label className="label">Nombre</label>
        <input name="nombre" defaultValue={r?.nombre ?? ""} className="input" required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <input name="descripcion" defaultValue={r?.descripcion ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" defaultValue={r?.tipo ?? "descuento"} className="input">
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Puntos requeridos</label>
          <input
            name="puntos_requeridos"
            type="number"
            min="0"
            defaultValue={r?.puntos_requeridos ?? 0}
            className="input"
            required
          />
        </div>
      </div>
      <div>
        <label className="label">URL de imagen</label>
        <input name="imagen_url" defaultValue={r?.imagen_url ?? ""} className="input" placeholder="https://…" />
      </div>
      <div>
        <label className="label">Válido hasta</label>
        <input
          name="valido_hasta"
          type="date"
          defaultValue={
            r?.valido_hasta
              ? new Date(r.valido_hasta).toISOString().slice(0, 10)
              : ""
          }
          className="input"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={r?.activa ?? true} />
        Activa
      </label>
    </>
  );
}

export default async function AdminRecompensas() {
  const recompensas = await prisma.recompensas
    .findMany({ orderBy: { puntos_requeridos: "asc" } })
    .catch(() => [] as Rec[]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Recompensas</h1>
          <p className="text-sm text-on-bg-muted">{recompensas.length} recompensas</p>
        </div>
        <FormDialog
          title="Nueva recompensa"
          triggerLabel={
            <>
              <Plus size={16} /> Nueva
            </>
          }
          action={saveRecompensa}
        >
          <Fields />
        </FormDialog>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Recompensa</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {recompensas.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.nombre}</p>
                  {r.descripcion && (
                    <p className="max-w-xs truncate text-xs text-on-bg-muted">
                      {r.descripcion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {TIPOS.find((t) => t.value === r.tipo)?.label ?? r.tipo ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-primary">
                  {r.puntos_requeridos}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {r.valido_hasta ? formatDate(r.valido_hasta) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`chip text-xs ${r.activa ? "chip-active" : ""}`}>
                    {r.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FormDialog
                      title="Editar recompensa"
                      triggerLabel={<Pencil size={16} />}
                      triggerClass="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2 hover:text-primary"
                      action={saveRecompensa}
                    >
                      <Fields r={r} />
                    </FormDialog>
                    <DeleteButton action={deleteRecompensa.bind(null, r.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {recompensas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay recompensas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
