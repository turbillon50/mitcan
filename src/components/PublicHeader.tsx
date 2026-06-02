import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-xl">
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
            Carnes Selectas
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-on-bg-muted md:flex">
          <Link href="/catalogo" className="transition hover:text-primary">
            Catálogo
          </Link>
          <Link href="/sucursales" className="transition hover:text-primary">
            Sucursales
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="btn-ghost px-3 py-2 text-sm">
              Entrar
            </Link>
            <Link href="/sign-up" className="btn-primary px-3 py-2 text-sm">
              Únete al club
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app/dashboard"
              className="btn-ghost px-3 py-2 text-sm"
              aria-label="Mi panel"
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Mi panel</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
