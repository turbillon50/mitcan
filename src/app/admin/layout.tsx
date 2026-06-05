import type { Metadata, Viewport } from "next";
import { UserButton } from "@clerk/nextjs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SettingsControls from "@/components/SettingsControls";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";

export const dynamic = "force-dynamic";

// Independent installable PWA for the admin (its own manifest/icon/scope),
// separate from the customer app.
export const metadata: Metadata = {
  title: "CSN Admin",
  manifest: "/admin.webmanifest",
  icons: {
    icon: "/icons/icon-admin-192.png",
    apple: "/icons/apple-touch-icon-admin-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "CSN Admin",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const locale = await getLocale();

  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-hairline bg-surface/80 px-6 py-3 backdrop-blur-xl lg:flex">
          <span className="text-sm font-medium text-on-bg-muted">
            {t(locale, "adm.topbar")}
          </span>
          <div className="flex items-center gap-3">
            <SettingsControls />
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">
                {admin.nombre ?? admin.email}
              </p>
              <p className="text-[11px] capitalize text-on-bg-muted">{admin.rol}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
