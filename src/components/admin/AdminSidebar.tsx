"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Beef,
  ClipboardList,
  Boxes,
  Users,
  Gift,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/productos", label: "Productos", icon: Beef },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/sucursales", label: "Sucursales", icon: Store },
  { href: "/admin/recompensas", label: "Recompensas", icon: Gift },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-primary/15 text-primary"
                : "text-on-bg-muted hover:bg-surface-2 hover:text-on-bg"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/assets/logo-badge-sm.png" alt="CSN" width={30} height={26} />
          <span className="font-display font-bold">Admin</span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-2"
          aria-label="Menú"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-b border-hairline bg-surface px-4 py-3 lg:hidden">
          {Nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-hairline bg-surface px-4 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2">
          <Image src="/assets/logo-badge-sm.png" alt="CSN" width={34} height={29} />
          <div>
            <p className="font-display text-lg font-bold leading-none">CSN</p>
            <p className="text-xs text-on-bg-muted">Panel admin</p>
          </div>
        </Link>
        {Nav}
        <Link
          href="/app/dashboard"
          className="mt-auto rounded-xl px-3.5 py-2.5 text-sm text-on-bg-muted transition hover:text-primary"
        >
          ← Volver a la app
        </Link>
      </aside>
    </>
  );
}
