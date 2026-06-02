"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteButton({
  action,
  confirmText = "¿Eliminar este registro? Esta acción no se puede deshacer.",
}: {
  action: () => Promise<void>;
  confirmText?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) start(() => action());
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
      aria-label="Eliminar"
    >
      <Trash2 size={16} />
    </button>
  );
}
