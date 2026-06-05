import type { Metadata } from "next";
import CarritoClient from "@/components/pedido/CarritoClient";

export const metadata: Metadata = { title: "Carrito — CSN" };

export default function CarritoPage() {
  return <CarritoClient />;
}
