import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import MensajesClient from "@/components/MensajesClient";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={22} className="text-primary" />
        <div>
          <h1 className="section-title text-2xl">Mensajes</h1>
          <p className="text-sm text-on-bg-muted">Atención directa con CSN</p>
        </div>
      </div>
      <MensajesClient />
    </div>
  );
}
