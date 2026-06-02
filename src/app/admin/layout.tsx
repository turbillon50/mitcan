import { UserButton } from "@clerk/nextjs";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-between border-b border-hairline px-6 py-3.5 lg:flex">
          <span className="text-sm text-on-bg-muted">
            Panel de administración · CSN
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{admin.nombre ?? admin.email}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
