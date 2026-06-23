"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-2xl">
        ⚠️
      </div>
      <h2 className="text-lg font-bold">Algo no cargó bien</h2>
      <p className="max-w-sm text-sm text-on-bg-muted">
        Ocurrió un problema. Reintenta o recarga la página.
      </p>
      <div className="flex gap-2">
        <button onClick={reset} className="btn-primary px-5 py-2.5 text-sm">Reintentar</button>
        <button onClick={() => window.location.reload()} className="btn-ghost px-5 py-2.5 text-sm">Recargar</button>
      </div>
    </div>
  );
}
