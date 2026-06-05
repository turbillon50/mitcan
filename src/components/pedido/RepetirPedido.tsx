"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

/** REPETIR MI PEDIDO — rellena el carrito con un pedido anterior (1 clic). */
export default function RepetirPedido({ pedidoId }: { pedidoId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const repetir = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos/repetir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.items)) throw new Error();
      localStorage.setItem("csn-cart-v1", JSON.stringify(data.items));
      router.push("/pedido/carrito");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button onClick={repetir} disabled={loading} className="btn-ghost h-9 px-3 text-xs">
      {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
      Repetir mi pedido
    </button>
  );
}
