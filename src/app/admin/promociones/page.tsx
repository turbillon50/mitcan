import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import { savePromocion, deletePromocion } from "../actions";

export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "descuento", label: "Descuento %" },
  { value: "monto", label: "Monto fijo $" },
  { value: "2x1", label: "2x1" },
  { value: "envio", label: "Envío gratis" },
  { value: "combo", label: "Combo" },
];

type Promo = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string | null;
  valor: unknown;
  producto_id: number | null;
  sucursal_id: number | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  imagen_url: string | null;
  activa: boolean | null;
};
type Opt = { id: number; nombre: string };

function Fields({
  p,
  productos,
  sucursales,
}: {
  p?: Promo;
  productos: Opt[];
  sucursales: Opt[];
}) {
  const d = (v: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div>
        <label className="label">Título</label>
        <input name="titulo" defaultValue={p?.titulo ?? ""} className="input" required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <input name="descripcion" defaultValue={p?.descripcion ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" defaultValue={p?.tipo ?? "descuento"} className="input">
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Valor</label>
          <input name="valor" type="number" step="0.01" defaultValue={p ? Number(p.valor ?? 0) || "" : ""} className="input" placeholder="opcional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Producto (opcional)</label>
          <select name="producto_id" defaultValue={p?.producto_id ?? ""} className="input">
            <option value="">— Todos —</option>
            {productos.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sucursal (opcional)</label>
          <select name="sucursal_id" defaultValue={p?.sucursal_id ?? ""} className="input">
            <option value="">— Todas —</option>
            {sucursales.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Inicia</label>
          <input name="fecha_inicio" type="date" defaultValue={d(p?.fecha_inicio ?? null)} className="input" />
        </div>
        <div>
          <label className="label">Termina</label>
          <input name="fecha_fin" type="date" defaultValue={d(p?.fecha_fin ?? null)} className="input" />
        </div>
      </div>
      <div>
        <label className="label">URL de imagen</label>
        <input name="imagen_url" defaultValue={p?.imagen_url ?? ""} className="input" placeholder="https://…" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={p?.activa ?? true} />
        Activa
      </label>
    </>
  );
}

export default async function AdminPromociones() {
  const [promos, productos, sucursales] = await Promise.all([
    prisma.promociones.findMany({ orderBy: { id: "desc" } }).catch(() => [] as Promo[]),
    prisma.productos.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }).catch(() => []),
    prisma.sucursales.findMany({ where: { activa: true }, orderBy: { id: "asc" } }).catch(() => []),
  ]);
  const pOpts = productos.map((x) => ({ id: x.id, nombre: x.nombre }));
  const sOpts = sucursales.map((x) => ({ id: x.id, nombre: x.nombre }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Promociones</h1>
          <p className="text-sm text-on-bg-muted">{promos.length} promociones</p>
        </div>
        <FormDialog
          title="Nueva promoción"
          triggerLabel={<><Plus size={16} /> Nueva</>}
          action={savePromocion}
        >
          <Fields productos={pOpts} sucursales={sOpts} />
        </FormDialog>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Promoción</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.titulo}</p>
                  {p.descripcion && (
                    <p className="max-w-xs truncate text-xs text-on-bg-muted">{p.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {TIPOS.find((t) => t.value === p.tipo)?.label ?? p.tipo ?? "—"}
                  {p.valor != null ? ` · ${Number(p.valor)}` : ""}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.fecha_inicio ? formatDate(p.fecha_inicio) : "—"} →{" "}
                  {p.fecha_fin ? formatDate(p.fecha_fin) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`chip text-xs ${p.activa ? "chip-active" : ""}`}>
                    {p.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FormDialog
                      title="Editar promoción"
                      triggerLabel={<Pencil size={16} />}
                      triggerClass="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2 hover:text-primary"
                      action={savePromocion}
                    >
                      <Fields p={p} productos={pOpts} sucursales={sOpts} />
                    </FormDialog>
                    <DeleteButton action={deletePromocion.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay promociones. Crea la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
