"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingBag, MapPin, Gift } from "lucide-react";

const ITEMS = [
  { href: "/app/dashboard", label: "Inicio", icon: Home },
  { href: "/catalogo", label: "Catálogo", icon: Grid3x3 },
  { href: "/app/pedido", label: "Pedidos", icon: ShoppingBag },
  { href: "/sucursales", label: "Sucursales", icon: MapPin },
  { href: "/app/recompensas", label: "Premios", icon: Gift },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-bg/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                active ? "text-primary" : "text-on-bg-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
