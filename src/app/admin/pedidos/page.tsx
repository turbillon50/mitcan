import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatMXN,
  formatDateTime,
  ESTADOS_PEDIDO,
  ESTADO_LABEL,
} from "@/lib/format";
import InlineSelect from "@/components/admin/InlineSelect";
import { updatePedidoEstado } from "../actions";

export const dynamic = "force-dynamic";

const ESTADO_OPTS = ESTADOS_PEDIDO.map((e) => ({
  value: e,
  label: ESTADO_LABEL[e],
}));

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; sucursal?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const estado = sp.estado && ESTADOS_PEDIDO.includes(sp.estado as never) ? sp.estado : undefined;
  const sucursalId = sp.sucursal ? parseInt(sp.sucursal) : undefined;
  const q = sp.q?.trim();

  const [pedidos, sucursales] = await Promise.all([
    prisma.pedidos
      .findMany({
        where: {
          estado,
          sucursal_id: sucursalId,
          ...(q
            ? {
                OR: [
                  { folio: { contains: q, mode: "insensitive" } },
                  { user: { nombre: { contains: q, mode: "insensitive" } } },
                  { user: { email: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: { user: true, sucursal: true, items: true },
        orderBy: { created_at: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.sucursales.findMany({ orderBy: { id: "asc" } }).catch(() => []),
  ]);

  const chip = (label: string, href: string, active: boolean) => (
    <Link href={href} className={`chip ${active ? "chip-active" : ""}`}>
      {label}
    </Link>
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
      <div>
        <h1 className="section-title text-2xl">Pedidos</h1>
        <p className="text-sm text-on-bg-muted">{pedidos.length} resultados</p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-2" action="/admin/pedidos">
        {estado && <input type="hidden" name="estado" value={estado} />}
        {sp.sucursal && <input type="hidden" name="sucursal" value={sp.sucursal} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar folio, cliente…"
          className="input max-w-xs"
        />
        <button type="submit" className="btn-ghost">
          Buscar
        </button>
      </form>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {chip("Todos", base({ estado: undefined }), !estado)}
        {ESTADOS_PEDIDO.map((e) =>
          chip(ESTADO_LABEL[e], base({ estado: e }), estado === e)
        )}
      </div>

      {sucursales.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {chip("Todas las sucursales", base({ sucursal: undefined }), !sucursalId)}
          {sucursales.map((s) =>
            chip(s.nombre, base({ sucursal: String(s.id) }), sucursalId === s.id)
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/pedidos/${p.id}`} className="text-primary hover:underline">
                    {p.folio ?? `#${p.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.user?.nombre ?? p.user?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {p.sucursal?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {formatDateTime(p.created_at)}
                </td>
                <td className="px-4 py-3 font-medium">
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
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-bg-muted">
                  No hay pedidos con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
