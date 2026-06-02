"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";

export default function FormDialog({
  title,
  triggerLabel,
  triggerClass = "btn-primary",
  action,
  children,
}: {
  title: string;
  triggerLabel: React.ReactNode;
  triggerClass?: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button className={triggerClass} onClick={() => setOpen(true)} type="button">
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-hairline bg-surface p-6 shadow-card sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-bg-muted hover:bg-surface-2"
                aria-label="Cerrar"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  await action(fd);
                  setOpen(false);
                })
              }
              className="flex flex-col gap-4"
            >
              {children}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                  disabled={pending}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
