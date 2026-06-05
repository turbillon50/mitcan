import type { Metadata } from "next";
import { CartProvider } from "@/components/pedido/CartProvider";
import PedidoHeader from "@/components/pedido/PedidoHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Pedido en línea — CSN Carnes Selectas",
  description:
    "Haz tu pedido en línea con CSN Carnes Selectas Nayarit. Entrega a domicilio en Tepic por solo $25. Pago contra entrega.",
};

export default function PedidoLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div
        className="min-h-dvh pb-28 md:pb-10"
        style={{ overscrollBehavior: "none" }}
      >
        <PedidoHeader />
        {/* h-14 header + safe area top */}
        <main
          className="mx-auto max-w-6xl px-4 pt-[calc(56px+env(safe-area-inset-top,0px)+16px)]"
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </CartProvider>
  );
}
