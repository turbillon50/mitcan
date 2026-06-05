import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ensureOnlineSchema } from "@/lib/online";
import CheckoutClient from "@/components/pedido/CheckoutClient";

export const metadata: Metadata = { title: "Confirmar pedido — CSN" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  await ensureOnlineSchema().catch(() => null);
  return (
    <CheckoutClient
      defaults={{
        nombre: user.nombre ?? "",
        telefono: user.telefono ?? "",
        direccion: (user as { direccion?: string | null }).direccion ?? "",
      }}
    />
  );
}
