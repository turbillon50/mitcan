import { redirect } from "next/navigation";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SlideIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { completarOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();

  // Already onboarded (has phone) -> straight to dashboard.
  if (user.telefono) redirect("/app/dashboard");

  const sucursales = await prisma.sucursales
    .findMany({ where: { activa: true }, orderBy: { nombre: "asc" } })
    .catch(() => []);

  return (
    <SlideIn from="bottom" className="mx-auto flex max-w-md flex-col gap-6 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/assets/logo-badge.png" alt="CSN" width={64} height={55} />
        <h1 className="section-title text-2xl">¡Bienvenido al Club CSN! 🥩</h1>
        <p className="text-sm text-on-bg-muted">
          Cuéntanos un poco de ti para personalizar tus recompensas y promos.
        </p>
      </div>

      <form action={completarOnboarding} className="card flex flex-col gap-4 p-5">
        <StaggerContainer className="flex flex-col gap-4">
          <StaggerItem>
            <label className="label">Tu nombre</label>
            <input
              name="nombre"
              className="input"
              defaultValue={user.nombre ?? ""}
              placeholder="Nombre y apellido"
            />
          </StaggerItem>
          <StaggerItem>
            <label className="label">Teléfono (WhatsApp)</label>
            <input
              name="telefono"
              type="tel"
              className="input"
              required
              placeholder="311 123 4567"
            />
          </StaggerItem>
          <StaggerItem>
            <label className="label">Tu sucursal favorita</label>
            <select name="sucursal_id" className="input" defaultValue="">
              <option value="">Elige una sucursal (opcional)</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.area}
                </option>
              ))}
            </select>
          </StaggerItem>
          <StaggerItem>
            <button type="submit" className="btn-primary w-full justify-center">
              Empezar a ganar puntos
            </button>
          </StaggerItem>
        </StaggerContainer>
      </form>
    </SlideIn>
  );
}
