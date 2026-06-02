"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { sumarPuntos } from "./actions";

const PRESETS = [10, 25, 50, 100];

export default function SumarPuntos({ userId }: { userId: string }) {
  const [valor, setValor] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (n: number) =>
    start(async () => {
      const res = await sumarPuntos(userId, n);
      setMsg(res.ok ? `+${n} puntos agregados ✅` : res.error ?? "Error");
      if (res.ok) setValor("");
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((n) => (
          <button
            key={n}
            disabled={pending}
            onClick={() => submit(n)}
            className="btn-ghost px-3 py-2 text-sm"
          >
            +{n}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Puntos personalizados"
          className="input"
        />
        <button
          disabled={pending || !valor}
          onClick={() => submit(parseInt(valor) || 0)}
          className="btn-primary shrink-0"
        >
          <Plus size={16} /> Sumar
        </button>
      </div>
      {msg && <p className="text-sm text-on-bg-muted">{msg}</p>}
    </div>
  );
}
