import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import CheckoutClient from "@/components/pedido/CheckoutClient";
import { getMapboxToken } from "@/lib/mapbox";

export const metadata: Metadata = { title: "Confirmar pedido — CSN" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  const mapboxToken = getMapboxToken() ?? "";
  return (
    <CheckoutClient
      defaults={{
        nombre: user.nombre ?? "",
        telefono: user.telefono ?? "",
        direccion: (user as { direccion?: string | null }).direccion ?? "",
      }}
      mapboxToken={mapboxToken}
    />
  );
}
