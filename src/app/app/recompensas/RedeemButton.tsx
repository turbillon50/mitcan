"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { canjearRecompensa } from "./actions";

export default function RedeemButton({
  recompensaId,
  disabled,
}: {
  recompensaId: number;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (disabled) {
    return (
      <span className="flex items-center gap-1 text-on-bg-muted">
        <Lock size={16} />
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await canjearRecompensa(recompensaId);
            setMsg(res.ok ? "¡Canjeada! 🎉" : res.error ?? "Error");
          })
        }
        className="btn-primary px-3 py-1.5 text-xs"
      >
        {pending ? "…" : "Canjear"}
      </button>
      {msg && <span className="text-[10px] text-on-bg-muted">{msg}</span>}
    </div>
  );
}
