"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingCart, MapPin, Gift } from "lucide-react";
import { useT } from "@/components/I18nProvider";

const ITEMS = [
  { href: "/app/dashboard", key: "bn.home", icon: Home },
  { href: "/catalogo", key: "bn.catalog", icon: Grid3x3 },
  { href: "/pedido", key: "bn.order", icon: ShoppingCart },
  { href: "/sucursales", key: "bn.branches", icon: MapPin },
  { href: "/app/recompensas", key: "bn.rewards", icon: Gift },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-bg/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, key, icon: Icon }) => {
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
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
