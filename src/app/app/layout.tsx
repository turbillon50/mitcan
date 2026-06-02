import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-hairline bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <Image
              src="/assets/logo-badge-sm.png"
              alt="CSN"
              width={34}
              height={29}
            />
          </Link>
          <div className="flex items-center gap-2">
            {/* Admin lives on its own independent key-gated link, not exposed here. */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-2 text-on-bg-muted"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
