import Link from "next/link";

export default function NotFound() {
  return (
    <div className="csn-gradient flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-bold">Página no encontrada</h1>
      <p className="max-w-sm text-on-bg-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Volver al inicio
      </Link>
    </div>
  );
}
