"use client";

import { useRef, useState, useTransition } from "react";
import { GripVertical, Check, Save } from "lucide-react";

type Item = { id: number; label: string; sub?: string };

export default function Reorderable({
  items: initial,
  onSave,
}: {
  items: Item[];
  onSave: (ids: number[]) => Promise<unknown>;
}) {
  const [items, setItems] = useState(initial);
  const drag = useRef<number | null>(null);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  function drop(i: number) {
    const from = drag.current;
    drag.current = null;
    if (from == null || from === i) return;
    setItems((arr) => {
      const next = [...arr];
      const [m] = next.splice(from, 1);
      next.splice(i, 0, m);
      return next;
    });
    setDirty(true);
  }

  const save = () =>
    start(async () => {
      await onSave(items.map((x) => x.id));
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });

  if (items.length === 0) return null;

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Orden (arrastra)</h2>
        <button
          onClick={save}
          disabled={pending || !dirty}
          className="btn-primary text-sm"
        >
          {saved ? <Check size={15} /> : <Save size={15} />} {saved ? "Guardado" : "Guardar orden"}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <div
            key={it.id}
            draggable
            onDragStart={() => (drag.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(i)}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-2 px-3 py-2"
          >
            <GripVertical size={16} className="cursor-grab text-on-bg-muted" />
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{it.label}</p>
              {it.sub && <p className="truncate text-xs text-on-bg-muted">{it.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
