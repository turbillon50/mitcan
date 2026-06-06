"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";

type Mensaje = {
  id: number;
  remitente: string;
  cuerpo: string;
  autor_nombre: string | null;
  created_at: string;
};

export default function MensajesClient() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mensajes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMensajes(data.mensajes ?? []);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  const enviar = async () => {
    const cuerpo = texto.trim();
    if (!cuerpo || sending) return;
    setSending(true);
    // Optimista
    const optimista: Mensaje = {
      id: Date.now(),
      remitente: "cliente",
      cuerpo,
      autor_nombre: null,
      created_at: new Date().toISOString(),
    };
    setMensajes((m) => [...m, optimista]);
    setTexto("");
    try {
      await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuerpo }),
      });
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        {loaded && mensajes.length === 0 && (
          <div className="card mx-auto flex max-w-sm flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle size={24} />
            </div>
            <p className="text-on-bg-muted">
              Escríbenos lo que necesites: pedidos, dudas, facturas o reclamos.
              Te respondemos por aquí.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2.5 pb-3">
          {mensajes.map((m) => {
            const mio = m.remitente === "cliente";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mio ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    mio
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm bg-surface-2 text-on-bg"
                  }`}
                >
                  {!mio && (
                    <p className="mb-0.5 text-[11px] font-bold text-primary">
                      {m.autor_nombre ?? "CSN"}
                    </p>
                  )}
                  <p className="whitespace-pre-line">{m.cuerpo}</p>
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-on-bg-muted">
                  {formatDateTime(m.created_at)}
                </span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <div
        className="sticky bottom-0 flex items-end gap-2 border-t border-hairline bg-bg/90 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={1}
          placeholder="Escribe un mensaje…"
          className="input max-h-32 min-h-[44px] flex-1 resize-none py-3"
        />
        <button
          onClick={enviar}
          disabled={sending || !texto.trim()}
          className="btn-primary h-11 w-11 shrink-0 !px-0"
          aria-label="Enviar"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
