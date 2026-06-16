import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import SettingsControls from "@/components/SettingsControls";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getContent } from "@/lib/data";
import { mergeBrand, type BrandContent } from "@/lib/brand-content";
import { IconDashboard } from "@/components/icons";

export default async function PublicHeader() {
  const [locale, brand] = await Promise.all([
    getLocale(),
    getContent<BrandContent>("brand").then(mergeBrand),
  ]);
  const tr = (k: string) => t(locale, k);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2" aria-label={brand.appName}>
          <img
            data-preview="logo"
            src={brand.logoUrl}
            alt={brand.appName}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="hidden leading-tight sm:block">
            <span data-preview="appname" className="block font-display text-base font-bold tracking-tight">{brand.appName}</span>
            <span data-preview="tagline" className="block text-[11px] font-semibold text-on-bg-muted">{brand.tagline || tr("brand.tagline")}</span>
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
              <IconDashboard size={16} />
              <span className="hidden sm:inline">{tr("nav.dashboard")}</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
