"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Beef,
  Tags,
  ClipboardList,
  Boxes,
  Users,
  Gift,
  Ticket,
  Megaphone,
  Bell,
  MessageCircle,
  BarChart3,
  BookOpen,
  Palette,
  Radio,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/components/I18nProvider";

type Item = { href: string; key: string; icon: LucideIcon };
const SECTIONS: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: "adm.sec.ops",
    items: [
      { href: "/admin", key: "adm.dashboard", icon: LayoutDashboard },
      { href: "/admin/c4", key: "adm.c4", icon: Radio },
      { href: "/admin/pedidos", key: "adm.orders", icon: ClipboardList },
      { href: "/admin/mensajes", key: "adm.messages", icon: MessageCircle },
      { href: "/admin/redenciones", key: "adm.redemptions", icon: Ticket },
    ],
  },
  {
    titleKey: "adm.sec.catalog",
    items: [
      { href: "/admin/productos", key: "adm.products", icon: Beef },
      { href: "/admin/categorias", key: "adm.categories", icon: Tags },
      { href: "/admin/inventario", key: "adm.inventory", icon: Boxes },
      { href: "/admin/precios", key: "adm.branchPrices", icon: Tags },
      { href: "/admin/sucursales", key: "adm.branches", icon: Store },
    ],
  },
  {
    titleKey: "adm.sec.marketing",
    items: [
      { href: "/admin/canvas", key: "adm.canvas", icon: Palette },
      { href: "/admin/promociones", key: "adm.promos", icon: Megaphone },
      { href: "/admin/recompensas", key: "adm.rewards", icon: Gift },
      { href: "/admin/notificaciones", key: "adm.notifications", icon: Bell },
    ],
  },
  {
    titleKey: "adm.sec.system",
    items: [
      { href: "/admin/estadisticas", key: "adm.stats", icon: BarChart3 },
      { href: "/admin/reportes", key: "adm.reports", icon: BarChart3 },
      { href: "/admin/usuarios", key: "adm.users", icon: Users },
      { href: "/admin/contenido", key: "adm.content", icon: LayoutDashboard },
      { href: "/admin/docs", key: "adm.docs", icon: BookOpen },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const Nav = (
    <nav className="flex flex-col gap-5">
      {SECTIONS.map((sec) => (
        <div key={sec.titleKey}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-bg-muted/70">
            {t(sec.titleKey)}
          </p>
          <div className="flex flex-col gap-0.5">
            {sec.items.map(({ href, key, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-on-bg/80 hover:bg-surface-2 hover:text-on-bg"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                  {t(key)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const Brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-2">
      <Image src="/assets/logo-badge.png" alt="CSN" width={38} height={33} />
      <div className="leading-tight">
        <p className="font-display text-base font-bold">CSN</p>
        <p className="text-[11px] text-on-bg-muted">{t("adm.controlCenter")}</p>
      </div>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-surface/90 px-4 py-3 backdrop-blur-xl lg:hidden" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        {Brand}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-2"
          aria-label={t("adm.menu")}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-b border-hairline bg-surface px-4 py-4 lg:hidden">{Nav}</div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-hairline bg-surface px-4 py-6 lg:flex">
        {Brand}
        {Nav}
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-on-bg-muted transition hover:text-primary"
        >
          <ExternalLink size={15} /> {t("adm.viewSite")}
        </Link>
      </aside>
    </>
  );
}
