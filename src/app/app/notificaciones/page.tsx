import { Bell, Tag, Gift, ShoppingBag, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ICON: Record<string, typeof Bell> = {
  promo: Tag,
  puntos: Gift,
  pedido: ShoppingBag,
  general: Megaphone,
};

export default async function NotificacionesPage() {
  const user = await requireUser();
  const locale = await getLocale();

  const notis = await prisma.notificaciones
    .findMany({ where: { user_id: user.id }, orderBy: { created_at: "desc" }, take: 100 })
    .catch(() => []);

  // Mark everything as read on open.
  const unreadIds = notis.filter((n) => !n.leida).map((n) => n.id);
  if (unreadIds.length) {
    await prisma.notificaciones
      .updateMany({ where: { id: { in: unreadIds } }, data: { leida: true } })
      .catch(() => null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="section-title text-2xl">{t(locale, "notif.title")}</h1>
        <p className="text-sm text-on-bg-muted">{t(locale, "notif.subtitle")}</p>
      </div>

      {notis.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-on-bg-muted">
            <Bell size={24} />
          </div>
          <p className="text-on-bg-muted">{t(locale, "notif.empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notis.map((n) => {
            const Icon = ICON[n.tipo ?? "general"] ?? Megaphone;
            return (
              <article
                key={n.id}
                className={`card flex gap-3 p-4 ${n.leida ? "" : "border-primary/30"}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-tight">{n.titulo}</h3>
                    {!n.leida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-on-bg-muted">{n.mensaje}</p>
                  <p className="mt-2 text-xs text-on-bg-muted">{formatDateTime(n.created_at)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
