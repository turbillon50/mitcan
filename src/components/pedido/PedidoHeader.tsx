"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, Phone, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { TEL_PEDIDOS } from "@/lib/online-const";

export default function PedidoHeader() {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const enRaiz = pathname === "/pedido";

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-hairline bg-bg/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {enRaiz ? (
            <Link href="/" aria-label="Inicio" className="flex items-center gap-2">
              <Image src="/assets/logo-badge-sm.png" alt="CSN" width={30} height={26} />
            </Link>
          ) : (
            <Link
              href="/pedido"
              aria-label="Volver"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-2 text-on-bg"
            >
              <ChevronLeft size={18} />
            </Link>
          )}
          <span className="truncate font-display text-base font-bold">Pedido en línea</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${TEL_PEDIDOS}`}
            className="flex h-9 items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-3 text-xs font-semibold text-on-bg"
            aria-label="Llamar para pedir"
          >
            <Phone size={14} className="text-primary" />
            <span className="hidden sm:inline">Llamar para pedir</span>
            <span className="sm:hidden">Llamar</span>
          </a>
          <Link
            href="/pedido/carrito"
            aria-label="Carrito"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-card"
          >
            <ShoppingCart size={17} />
            {ready && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
