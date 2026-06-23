import Link from "next/link";
import { CheckCircle2, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { TEL_PEDIDOS, TEL_PEDIDOS_DISPLAY } from "@/lib/online-const";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PedidoConfirmado({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const tr = (k: string) => t(locale, k);
  const pedido = await prisma.pedidos
    .findFirst({ where: { folio, user_id: user.id } })
    .catch(() => null);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 pb-6 pt-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 size={44} />
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold">{tr("confirm.title")}</h1>
        <p className="mt-1 text-on-bg-muted">{tr("confirm.yourNumber")}</p>
        <p className="mt-2 rounded-2xl border border-hairline bg-surface px-6 py-3 font-mono text-2xl font-extrabold tracking-wider text-primary">
          {folio}
        </p>
      </div>
      {pedido && (
        <p className="text-sm text-on-bg-muted">
          {tr("confirm.totalToPay")}{" "}
          <strong className="text-on-bg">{formatMXN(Number(pedido.total))}</strong>
          {pedido.puntos_ganados ? (
            <> · {tr("confirm.willEarn")} <strong className="text-accent">{pedido.puntos_ganados} {tr("rewards.points")}</strong> {tr("confirm.onReceiving")}</>
          ) : null}
        </p>
      )}
      <div className="flex w-full flex-col gap-2">
        <Link href={`/pedido/seguimiento/${folio}`} className="btn-primary w-full py-3 text-base">
          {tr("confirm.trackBtn")}
        </Link>
        <Link href="/pedido" className="btn-ghost w-full">{tr("confirm.orderAgain")}</Link>
        <a href={`tel:${TEL_PEDIDOS}`} className="btn-ghost w-full">
          <Phone size={15} /> {tr("confirm.questions")} {TEL_PEDIDOS_DISPLAY}
        </a>
      </div>
    </div>
  );
}
