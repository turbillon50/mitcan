import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import SeguimientoClient from "@/components/pedido/SeguimientoClient";

export const metadata: Metadata = { title: "Seguimiento — CSN" };
export const dynamic = "force-dynamic";

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  await requireUser();
  const { folio } = await params;
  return <SeguimientoClient folio={folio} />;
}
