import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import SettingsControls from "@/components/SettingsControls";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function PublicHeader() {
  const locale = await getLocale();
  const tr = (k: string) => t(locale, k);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2" aria-label="CSN">
          <Image
            src="/assets/logo-badge-sm.png"
            alt="CSN — Carnes Selectas Nayarit"
            width={36}
            height={31}
            priority
          />
          <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">
            {tr("brand.tagline")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-on-bg-muted md:flex">
          <Link href="/pedido" className="font-semibold text-primary transition hover:brightness-110">
            Pedido en línea
          </Link>
          <Link href="/catalogo" className="transition hover:text-primary">
            {tr("nav.catalog")}
          </Link>
          <Link href="/sucursales" className="transition hover:text-primary">
            {tr("nav.branches")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <SettingsControls />
          <SignedOut>
            <Link href="/sign-in" className="btn-ghost px-3 py-2 text-sm">
              {tr("nav.signin")}
            </Link>
            <Link href="/sign-up" className="btn-primary px-3 py-2 text-sm">
              {tr("nav.join")}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app/dashboard"
              className="btn-ghost px-3 py-2 text-sm"
              aria-label={tr("nav.dashboard")}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">{tr("nav.dashboard")}</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
