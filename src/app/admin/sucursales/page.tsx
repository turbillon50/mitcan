import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS } from "@/lib/data";
import { formatPhone } from "@/lib/format";
import FormDialog from "@/components/admin/FormDialog";
import DeleteButton from "@/components/admin/DeleteButton";
import LocationPicker from "@/components/admin/LocationPicker";
import { getMapboxToken } from "@/lib/mapbox";
import { saveSucursal, deleteSucursal } from "../actions";

export const dynamic = "force-dynamic";

const AREA_OPTS = Object.entries(AREA_LABELS);

type Suc = {
  id: number;
  nombre: string;
  area: string | null;
  direccion: string | null;
  telefono: string | null;
  horario: string | null;
  lat: unknown;
  lng: unknown;
  activa: boolean | null;
};

function Fields({ s, token }: { s?: Suc; token: string | null }) {
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div>
        <label className="label">Nombre</label>
        <input name="nombre" defaultValue={s?.nombre ?? ""} className="input" required />
      </div>
      <div>
        <label className="label">Área</label>
        <select name="area" defaultValue={s?.area ?? ""} className="input">
          <option value="">— Sin área —</option>
          {AREA_OPTS.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input name="direccion" defaultValue={s?.direccion ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Teléfono</label>
          <input name="telefono" defaultValue={s?.telefono ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Horario</label>
          <input name="horario" defaultValue={s?.horario ?? ""} className="input" />
        </div>
      </div>
      <LocationPicker
        token={token}
        defaultLat={s?.lat != null ? Number(s.lat) : null}
        defaultLng={s?.lng != null ? Number(s.lng) : null}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={s?.activa ?? true} />
        Activa
      </label>
    </>
  );
}

export default async function AdminSucursales() {
  const token = getMapboxToken();
  const sucursales = await prisma.sucursales
    .findMany({ orderBy: { id: "asc" } })
    .catch(() => [] as Suc[]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Sucursales</h1>
          <p className="text-sm text-on-bg-muted">{sucursales.length} sucursales</p>
        </div>
        <FormDialog
          title="Nueva sucursal"
          triggerLabel={
            <>
              <Plus size={16} /> Nueva
            </>
          }
          action={saveSucursal}
        >
          <Fields token={token} />
        </FormDialog>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sucursales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.nombre}</p>
                  {s.direccion && (
                    <p className="max-w-xs truncate text-xs text-on-bg-muted">
                      {s.direccion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {s.area ? AREA_LABELS[s.area] ?? s.area : "—"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {formatPhone(s.telefono) || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`chip text-xs ${
                      s.activa ? "chip-active" : ""
                    }`}
                  >
                    {s.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <FormDialog
                      title="Editar sucursal"
                      triggerLabel={<Pencil size={16} />}
                      triggerClass="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2 hover:text-primary"
                      action={saveSucursal}
                    >
                      <Fields s={s} token={token} />
                    </FormDialog>
                    <DeleteButton action={deleteSucursal.bind(null, s.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {sucursales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay sucursales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
