"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Trash2, GripVertical, Check, Eye, EyeOff } from "lucide-react";
import { saveBanners, type Banner } from "./actions";

export default function BannersEditor({ initial }: { initial: Banner[] }) {
  const [items, setItems] = useState<Banner[]>(initial);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setItems((x) => [...x, { imagen_url: data.url, activo: true }]);
      else alert(data.error || "Error al subir");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function drop(i: number) {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from == null || from === i) return;
    setItems((arr) => {
      const next = [...arr];
      const [m] = next.splice(from, 1);
      next.splice(i, 0, m);
      return next;
    });
  }

  const save = () =>
    start(async () => {
      await saveBanners(items);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Banners del carrusel</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-ghost text-sm"
          >
            <Upload size={15} /> {busy ? "Subiendo…" : "Subir banner"}
          </button>
          <button onClick={save} disabled={pending} className="btn-primary text-sm">
            {saved ? <Check size={15} /> : null} {saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-bg-muted">
          Sin banners. Sube el primero. Arrastra para reordenar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((b, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => (dragIdx.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(i)}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-2"
            >
              <GripVertical size={16} className="cursor-grab text-on-bg-muted" />
              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                {b.imagen_url && (
                  <Image src={b.imagen_url} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>
              <span className="flex-1 truncate text-xs text-on-bg-muted">{b.imagen_url}</span>
              <button
                type="button"
                onClick={() =>
                  setItems((x) => x.map((it, j) => (j === i ? { ...it, activo: !it.activo } : it)))
                }
                className="text-on-bg-muted hover:text-primary"
                title={b.activo ? "Activo" : "Oculto"}
              >
                {b.activo ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setItems((x) => x.filter((_, j) => j !== i))}
                className="text-on-bg-muted hover:text-rose-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
