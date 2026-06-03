import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM ?? "CSN <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("[CSN] RESEND_API_KEY missing — email skipped:", opts.subject);
    return { skipped: true };
  }
  try {
    const res = await resend.emails.send({ from: FROM, ...opts });
    return res;
  } catch (err) {
    console.error("[CSN] Resend error:", err);
    return { error: true };
  }
}

export function welcomeEmail(nombre?: string | null) {
  return `
  <div style="font-family:system-ui,sans-serif;background:#ffffff;color:#1A0A05;border:1px solid #eee;padding:32px;border-radius:16px">
    <h1 style="color:#CC2B18;margin:0 0 8px">¡Bienvenido a CSN! 🥩</h1>
    <p style="color:#7A5040">Hola${nombre ? ` ${nombre}` : ""}, tu cuenta del Club Carnes Selectas Nayarit está lista.</p>
    <p style="color:#7A5040">Acumula puntos en cada compra y canjéalos por recompensas en tu carnicería favorita.</p>
    <a href="https://carnesn.ink/app/dashboard" style="display:inline-block;margin-top:16px;background:#ff8c00;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Ir a mi panel</a>
  </div>`;
}

export function pedidoEmail(folio: string, total: string, estado: string) {
  return `
  <div style="font-family:system-ui,sans-serif;background:#ffffff;color:#1A0A05;border:1px solid #eee;padding:32px;border-radius:16px">
    <h1 style="color:#CC2B18;margin:0 0 8px">Pedido ${folio}</h1>
    <p style="color:#7A5040">Estado: <strong style="color:#ff8c00">${estado}</strong></p>
    <p style="color:#7A5040">Total: <strong>${total}</strong></p>
    <a href="https://carnesn.ink/app/pedido" style="display:inline-block;margin-top:16px;background:#ff8c00;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Ver pedido</a>
  </div>`;
}
