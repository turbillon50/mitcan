import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS, getSucursales } from "@/lib/data";
import { formatDate } from "@/lib/format";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import ImageUpload from "@/components/admin/ImageUpload";
import Reorderable from "@/components/admin/Reorderable";
import { savePromocion, deletePromocion, reordenarPromos } from "../actions";

export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "descuento", label: "Descuento %" },
  { value: "monto", label: "Precio especial" },
  { value: "2x1", label: "2x1" },
  { value: "envio", label: "Envío gratis" },
  { value: "combo", label: "Combo" },
];

type Promo = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string | null;
  precio_promo: unknown;
  unidad: string | null;
  producto_id: number | null;
  sucursales: string[];
  imagen_url: string | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  activa: boolean | null;
};
type Opt = { id: number; nombre: string; area?: string | null };

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
  const sel = new Set(p?.sucursales ?? ["todas"]);
  const todas = sel.has("todas") || !p;
  const byArea = Object.keys(AREA_LABELS).map((a) => ({
    area: a,
    label: AREA_LABELS[a],
    items: sucursales.filter((s) => s.area === a),
  }));

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
      <ImageUpload defaultUrl={p?.imagen_url} />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" defaultValue={p?.tipo ?? "monto"} className="input">
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Precio promo</label>
          <input name="precio_promo" type="number" step="0.01" defaultValue={p ? Number(p.precio_promo ?? 0) || "" : ""} className="input" />
        </div>
        <div>
          <label className="label">Unidad</label>
          <input name="unidad" defaultValue={p?.unidad ?? "kg"} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Producto (opcional)</label>
        <select name="producto_id" defaultValue={p?.producto_id ?? ""} className="input">
          <option value="">— Ninguno —</option>
          {productos.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
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
        <label className="label">Sucursales</label>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="todas" defaultChecked={todas} /> Todas las sucursales
        </label>
        <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-hairline p-3">
          {byArea.map((g) => (
            <div key={g.area}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-on-bg-muted">{g.label}</p>
              <div className="grid grid-cols-2 gap-1">
                {g.items.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" name="suc" value={s.id} defaultChecked={sel.has(String(s.id))} />
                    {s.nombre}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={p?.activa ?? true} /> Activa
      </label>
    </>
  );
}

export default async function AdminPromociones() {
  const [promos, productos, sucursales] = await Promise.all([
    prisma.promociones.findMany({ orderBy: [{ orden: "asc" }, { id: "desc" }] }).catch(() => [] as Promo[]),
    prisma.productos.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }).catch(() => []),
    getSucursales({ soloActivas: true }),
  ]);
  const pOpts = productos.map((x) => ({ id: x.id, nombre: x.nombre }));
  const sOpts = sucursales.map((x) => ({ id: x.id, nombre: x.nombre, area: x.area }));

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

      <Reorderable
        items={promos.map((p) => ({
          id: p.id,
          label: p.titulo,
          sub: p.activa ? "Activa" : "Inactiva",
        }))}
        onSave={async (ids) => {
          "use server";
          await reordenarPromos(ids);
        }}
      />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Promoción</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Sucursales</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3 text-primary">
                  {p.precio_promo != null ? `$${Number(p.precio_promo)} /${p.unidad ?? "kg"}` : "—"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.sucursales?.includes("todas") ? "Todas" : `${p.sucursales?.length ?? 0} sucursal(es)`}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.fecha_inicio ? formatDate(p.fecha_inicio) : "—"} → {p.fecha_fin ? formatDate(p.fecha_fin) : "—"}
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
                <td colSpan={6} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay promociones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
