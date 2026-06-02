import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN, formatDateTime, ESTADOS_PEDIDO, ESTADO_LABEL } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Store, ChefHat, Bike, CheckCircle2, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

const STEPS = [
  { estado: "confirmado", icon: Store },
  { estado: "en_camino", icon: Bike },
  { estado: "entregado", icon: CheckCircle2 },
];

export default async function PedidoPage() {
  const user = await getCurrentDbUser();
  const pedidos = user
    ? await prisma.pedidos
        .findMany({
          where: { user_id: user.id },
          include: { items: { include: { producto: true } }, sucursal: true },
          orderBy: { created_at: "desc" },
          take: 20,
        })
        .catch(() => [])
    : [];

  const activo = pedidos.find((p) =>
    ["nuevo", "pendiente", "confirmado", "en_camino"].includes(p.estado ?? "")
  );

  return (
    <div className="flex flex-col gap-7">
      <h1 className="section-title text-2xl">Mis pedidos</h1>

      {pedidos.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <ShoppingBag size={36} className="text-primary/50" />
          <p className="text-on-bg-muted">Aún no tienes pedidos.</p>
        </div>
      )}

      {/* Tracking del pedido activo */}
      {activo && (
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-on-bg-muted">
                {activo.folio ?? `#${activo.id}`}
              </p>
              <h2 className="text-lg font-bold">Tu pedido va en camino</h2>
            </div>
            <StatusBadge estado={activo.estado} />
          </div>
          <div className="relative flex items-center justify-between px-2">
            <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-3" />
            {[{ estado: "nuevo", icon: ChefHat }, ...STEPS].map((s) => {
              const order = ["nuevo", "confirmado", "en_camino", "entregado"];
              const done =
                order.indexOf(activo.estado ?? "") >= order.indexOf(s.estado);
              const Icon = s.icon;
              return (
                <div key={s.estado} className="relative z-10 flex flex-col items-center gap-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      done
                        ? "bg-accent text-white shadow-glow"
                        : "bg-surface-3 text-on-bg-muted"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] text-on-bg-muted">
                    {ESTADO_LABEL[s.estado]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Historial */}
      <section className="flex flex-col gap-3">
        {pedidos.map((p) => (
          <article key={p.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-on-bg-muted">
                  {p.folio ?? `#${p.id}`} · {formatDateTime(p.created_at)}
                </p>
                <p className="font-bold">
                  {p.sucursal?.nombre ?? "Sucursal"} ·{" "}
                  {formatMXN(Number(p.total))}
                </p>
              </div>
              <StatusBadge estado={p.estado} />
            </div>
            {p.items.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-hairline pt-3 text-sm text-on-bg-muted">
                {p.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>
                      {Number(it.cantidad)}× {it.producto?.nombre ?? "Producto"}
                    </span>
                    <span>{formatMXN(Number(it.subtotal))}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <p className="text-center text-xs text-on-bg-muted">
        Estados: {ESTADOS_PEDIDO.map((e) => ESTADO_LABEL[e]).join(" · ")}
      </p>
    </div>
  );
}
