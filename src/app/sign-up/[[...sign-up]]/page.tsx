import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { SlideIn } from "@/components/motion";

// SECURITY: render fresh on every request so the registration form is never
// served with any cached/serialized session state. It carries NO defaultValue,
// no query-param prefill and no SSR credentials — the form always starts empty.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="csn-gradient flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo-badge.png" alt="CSN" width={56} height={48} />
      </Link>
      <SlideIn from="bottom"><SignUp fallbackRedirectUrl="/app/onboarding" signInUrl="/sign-in" /></SlideIn>
      <p className="text-sm text-on-bg-muted">¿Ya tienes cuenta?</p>
      <Link href="/sign-in" className="btn-ghost px-6 py-2.5">
        Ya estoy registrado — Iniciar sesión
      </Link>
    </div>
  );
}
