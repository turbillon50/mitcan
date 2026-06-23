"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Beef } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatMXN } from "@/lib/format";
import { ENVIO_FIJO } from "@/lib/online-const";
import { useT } from "@/components/I18nProvider";

export default function CarritoClient() {
  const { items, ready, setCantidad, remove, subtotal } = useCart();
  const t = useT();

  if (!ready) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-surface-2" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <ShoppingCart size={40} className="text-primary/50" />
        <div>
          <h1 className="font-display text-xl font-bold">{t("cart.empty")}</h1>
          <p className="mt-1 text-sm text-on-bg-muted">
            {t("cart.emptyHint")}
          </p>
        </div>
        <Link href="/pedido" className="btn-primary px-6 py-3">
          {t("cart.seeProducts")}
        </Link>
      </div>
    );
  }

  const total = subtotal + ENVIO_FIJO;

  return (
    <div className="flex flex-col gap-6 pb-6 lg:grid lg:grid-cols-[1fr_340px]">
      {/* Lista de productos */}
      <section className="flex min-w-0 flex-col gap-3">
        <h1 className="section-title text-2xl">{t("cart.title")}</h1>
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.article
              key={it.producto_id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="card flex min-w-0 items-center gap-3 overflow-hidden p-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {it.imagen_url ? (
                  <Image src={it.imagen_url} alt={it.nombre} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-on-bg-muted/40">
                    <Beef size={20} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="truncate text-sm font-bold leading-tight">{it.nombre}</h3>
                <p className="text-xs text-on-bg-muted">{formatMXN(it.precio)} / {it.unidad}</p>
                <p className="text-sm font-extrabold text-primary">{formatMXN(it.precio * it.cantidad)}</p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  onClick={() => remove(it.producto_id)}
                  aria-label={`${t("cart.remove")} ${it.nombre}`}
                  className="text-on-bg-muted transition hover:text-rose-400"
                >
                  <Trash2 size={15} />
                </button>
                <div className="flex items-center rounded-full border border-hairline bg-surface-2">
                  <button
                    onClick={() => setCantidad(it.producto_id, it.cantidad - 1)}
                    aria-label={t("cart.less")}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-3"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{it.cantidad}</span>
                  <button
                    onClick={() => setCantidad(it.producto_id, it.cantidad + 1)}
                    aria-label={t("cart.more")}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-3"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>

      <aside className="w-full lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col gap-3 p-5">
          <h2 className="font-display text-lg font-bold">{t("cart.summary")}</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-bg-muted">{t("cart.subtotal")}</span>
            <span className="font-semibold">{formatMXN(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-bg-muted">{t("cart.delivery")}</span>
            <span className="font-semibold">{formatMXN(ENVIO_FIJO)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-3 text-base">
            <span className="font-bold">{t("cart.total")}</span>
            <span className="font-extrabold text-primary">{formatMXN(total)}</span>
          </div>
          <Link href="/pedido/checkout" className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base">
            {t("cart.checkout")} <ArrowRight size={16} />
          </Link>
          <Link href="/pedido" className="btn-ghost w-full">
            {t("cart.continueShopping")}
          </Link>
          <p className="text-center text-[11px] text-on-bg-muted">
            {t("checkout.cash")} · {t("checkout.delivery")}
          </p>
        </div>
      </aside>
    </div>
  );
}
