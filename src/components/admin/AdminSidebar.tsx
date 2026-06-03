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
  BarChart3,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };
const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Operación",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/admin/redenciones", label: "Redenciones", icon: Ticket },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Beef },
      { href: "/admin/categorias", label: "Categorías", icon: Tags },
      { href: "/admin/inventario", label: "Inventario y precios", icon: Boxes },
      { href: "/admin/sucursales", label: "Sucursales", icon: Store },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promociones", label: "Promociones", icon: Megaphone },
      { href: "/admin/recompensas", label: "Recompensas", icon: Gift },
      { href: "/admin/notificaciones", label: "Notificaciones", icon: Bell },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const Nav = (
    <nav className="flex flex-col gap-5">
      {SECTIONS.map((sec) => (
        <div key={sec.title}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-bg-muted/70">
            {sec.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {sec.items.map(({ href, label, icon: Icon }) => {
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
                  {label}
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
        <p className="text-[11px] text-on-bg-muted">Centro de control</p>
      </div>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-surface/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        {Brand}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-2"
          aria-label="Menú"
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
          <ExternalLink size={15} /> Ver sitio público
        </Link>
      </aside>
    </>
  );
}
