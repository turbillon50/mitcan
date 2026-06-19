import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN, formatDateTime, ESTADOS_PEDIDO, ESTADOS_ADMIN, ESTADO_LABEL } from "@/lib/format";
import InlineSelect from "@/components/admin/InlineSelect";
import ExportCsv from "@/components/admin/ExportCsv";
import AsignarRepartidorInline from "@/components/admin/AsignarRepartidorInline";
import { updatePedidoEstado, asignarRepartidor } from "../actions";

export const dynamic = "force-dynamic";

const ESTADO_OPTS = ESTADOS_ADMIN.map((e) => ({ value: e, label: ESTADO_LABEL[e] }));

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; sucursal?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const TODOS = [...new Set<string>([...ESTADOS_ADMIN, ...ESTADOS_PEDIDO])];
  const estado = sp.estado && TODOS.includes(sp.estado) ? sp.estado : undefined;
  const sucursalId = sp.sucursal ? parseInt(sp.sucursal) : undefined;
  const q = sp.q?.trim();

  const [pedidos, sucursales, repartidores] = await Promise.all([
    prisma.pedidos.findMany({
      where: {
        estado,
        sucursal_id: sucursalId,
        ...(q ? { OR: [
          { folio: { contains: q, mode: "insensitive" } },
          { user: { nombre: { contains: q, mode: "insensitive" } } },
        ]} : {}),
      },
      include: { user: true, sucursal: true, items: true },
      orderBy: { created_at: "desc" },
      take: 100,
    }).catch(() => []),
    prisma.sucursales.findMany({ orderBy: { id: "asc" } }).catch(() => []),
    prisma.users.findMany({
      where: { rol: "repartidor" },
      select: { id: true, nombre: true, email: true },
    }).catch(() => []),
  ]);

  const chip = (label: string, href: string, active: boolean) => (
    <Link href={href} className={`chip ${active ? "chip-active" : ""}`}>{label}</Link>
  );
  const base = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { estado, sucursal: sp.sucursal, q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/admin/pedidos${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-2xl">Pedidos</h1>
          <p className="text-sm text-on-bg-muted">{pedidos.length} resultados</p>
        </div>
        <ExportCsv filename="pedidos" rows={pedidos.map((p) => ({
          folio: p.folio ?? `#${p.id}`,
          cliente: p.user?.nombre ?? p.user?.email ?? "",
          sucursal: p.sucursal?.nombre ?? "",
          fecha: p.created_at ? new Date(p.created_at).toISOString() : "",
          total: Number(p.total),
          estado: p.estado ?? "",
        }))} />
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/pedidos">
        {estado && <input type="hidden" name="estado" value={estado} />}
        {sp.sucursal && <input type="hidden" name="sucursal" value={sp.sucursal} />}
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar folio, cliente…" className="input max-w-xs" />
        <button type="submit" className="btn-ghost">Buscar</button>
      </form>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {chip("Todos", base({ estado: undefined }), !estado)}
        {ESTADOS_PEDIDO.map((e) => chip(ESTADO_LABEL[e], base({ estado: e }), estado === e))}
      </div>

      {sucursales.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {chip("Todas", base({ sucursal: undefined }), !sucursalId)}
          {sucursales.map((s) => chip(s.nombre, base({ sucursal: String(s.id) }), sucursalId === s.id))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Repartidor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pedidos.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/pedidos/${p.id}`} className="text-primary hover:underline font-mono">
                    {p.folio ?? `#${p.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-on-bg-muted max-w-[140px] truncate">
                  {p.user?.nombre ?? p.user?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted whitespace-nowrap">
                  {formatDateTime(p.created_at)}
                </td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">
                  {formatMXN(Number(p.total))}
                </td>
                <td className="px-4 py-3">
                  <InlineSelect
                    value={p.estado ?? "nuevo"}
                    options={ESTADO_OPTS}
                    action={async (next) => {
                      "use server";
                      await updatePedidoEstado(p.id, next);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <AsignarRepartidorInline
                    pedidoId={p.id}
                    repartidorActualId={(p as unknown as { repartidor_id?: string | null }).repartidor_id ?? null}
                    repartidorActualNombre={(p as unknown as { repartidor?: string | null }).repartidor ?? null}
                    repartidores={repartidores.map(r => ({ id: r.id, nombre: r.nombre ?? r.email ?? r.id }))}
                    action={async (repId: string, nombre: string) => {
                      "use server";
                      await asignarRepartidor(p.id, repId, nombre);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${p.id}`} className="btn-ghost text-xs px-3 py-1.5">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-on-bg-muted">No hay pedidos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
