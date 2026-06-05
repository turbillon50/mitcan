import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  formatMXN,
  formatDateTime,
  ESTADOS_ADMIN,
  ESTADO_LABEL,
} from "@/lib/format";
import InlineSelect from "@/components/admin/InlineSelect";
import StatusBadge from "@/components/StatusBadge";
import { updatePedidoEstado, asignarRepartidor } from "../../actions";
import RepartidorForm from "@/components/admin/RepartidorForm";
import { ensureOnlineSchema } from "@/lib/online";

export const dynamic = "force-dynamic";

const ESTADO_OPTS = ESTADOS_ADMIN.map((e) => ({ value: e, label: ESTADO_LABEL[e] }));

export default async function AdminPedidoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureOnlineSchema().catch(() => null);
  const pedido = await prisma.pedidos
    .findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        sucursal: true,
        items: { include: { producto: true } },
        eventos: { orderBy: { created_at: "asc" } },
        encuesta: true,
      },
    })
    .catch(() => null);

  const empleados = await prisma.users
    .findMany({ where: { rol: "empleado" }, select: { nombre: true } })
    .catch(() => [] as { nombre: string | null }[]);
  const repartidores = [
    ...new Set([
      ...empleados.map((e) => e.nombre).filter((n): n is string => Boolean(n)),
      ...(pedido?.repartidor ? [pedido.repartidor] : []),
    ]),
  ];

  if (!pedido) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/pedidos" className="text-sm text-primary">
          ← Pedidos
        </Link>
        <p className="text-on-bg-muted">Pedido no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/pedidos"
            className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
          >
            <ChevronLeft size={15} /> Pedidos
          </Link>
          <h1 className="section-title text-2xl">{pedido.folio ?? `#${pedido.id}`}</h1>
          <p className="text-sm text-on-bg-muted">{formatDateTime(pedido.created_at)}</p>
        </div>
        <StatusBadge estado={pedido.estado} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Cliente</p>
          <p className="font-bold">{pedido.user?.nombre ?? "—"}</p>
          <p className="text-sm text-on-bg-muted">{pedido.user?.email}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Sucursal</p>
          <p className="font-bold">{pedido.sucursal?.nombre ?? "—"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Estado</p>
          <div className="mt-1">
            <InlineSelect
              value={pedido.estado ?? "nuevo"}
              options={ESTADO_OPTS}
              action={async (next) => {
                "use server";
                await updatePedidoEstado(pedido.id, next);
              }}
            />
          </div>
        </div>
      </div>

      {/* Entrega / repartidor / encuesta (pedido en línea) */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col gap-3 p-4">
          <p className="text-xs uppercase tracking-wide text-on-bg-muted">Entrega</p>
          {pedido.tipo === "en_linea" ? (
            <>
              <p className="text-sm"><strong>📍 Dirección:</strong> {pedido.direccion_entrega ?? "—"}</p>
              <p className="text-sm"><strong>📞 Teléfono:</strong> {pedido.telefono_entrega ?? "—"}</p>
              <p className="text-sm"><strong>💵 Pago:</strong> Contra entrega</p>
              {pedido.entregado_at && (
                <p className="text-sm">
                  <strong>✅ Entregado:</strong> {formatDateTime(pedido.entregado_at)}
                  {pedido.repartidor ? ` · ${pedido.repartidor}` : ""}
                </p>
              )}
              <RepartidorForm
                pedidoId={pedido.id}
                inicial={pedido.repartidor ?? ""}
                repartidores={repartidores}
                action={async (id, rep) => {
                  "use server";
                  await asignarRepartidor(id, rep);
                }}
              />
            </>
          ) : (
            <p className="text-sm text-on-bg-muted">Pedido de mostrador.</p>
          )}
        </div>
        <div className="card flex flex-col gap-2 p-4">
          <p className="text-xs uppercase tracking-wide text-on-bg-muted">Historial de estados</p>
          {pedido.eventos.length === 0 && (
            <p className="text-sm text-on-bg-muted">Sin eventos registrados.</p>
          )}
          <ul className="flex flex-col gap-1.5 text-sm">
            {pedido.eventos.map((ev) => (
              <li key={ev.id} className="flex justify-between gap-3">
                <span>{ESTADO_LABEL[ev.estado] ?? ev.estado}</span>
                <span className="text-on-bg-muted">{formatDateTime(ev.created_at)}</span>
              </li>
            ))}
          </ul>
          {pedido.encuesta && (
            <div className="mt-2 border-t border-hairline pt-2 text-sm">
              <p className="text-xs uppercase tracking-wide text-on-bg-muted">Encuesta</p>
              <p>
                {"⭐".repeat(pedido.encuesta.estrellas ?? 0)} ·{" "}
                {pedido.encuesta.completo ? "Llegó completo" : "Llegó incompleto"}
              </p>
              {pedido.encuesta.comentarios && (
                <p className="text-on-bg-muted">“{pedido.encuesta.comentarios}”</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-hairline text-left text-xs uppercase tracking-wide text-on-bg-muted">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pedido.items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3 font-medium">
                  {it.producto?.nombre ?? "Producto"}
                </td>
                <td className="px-4 py-3 text-on-bg-muted">{Number(it.cantidad)}</td>
                <td className="px-4 py-3 text-on-bg-muted">
                  {formatMXN(Number(it.precio_unitario))}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatMXN(Number(it.subtotal))}
                </td>
              </tr>
            ))}
            {pedido.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-on-bg-muted">
                  Sin artículos.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-hairline">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-on-bg-muted">Subtotal</td>
              <td className="px-4 py-2 text-right">{formatMXN(Number(pedido.subtotal))}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-on-bg-muted">Envío</td>
              <td className="px-4 py-2 text-right">{formatMXN(Number(pedido.envio ?? 0))}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-on-bg-muted">Total</td>
              <td className="px-4 py-3 text-right font-bold text-primary">
                {formatMXN(Number(pedido.total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {pedido.notas && (
        <div className="card p-4">
          <p className="text-xs text-on-bg-muted">Notas</p>
          <p>{pedido.notas}</p>
        </div>
      )}
    </div>
  );
}
