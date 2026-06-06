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

/* ---------- Plantilla "pro" reutilizable (tablas + estilos inline) ---------- */
const ROJO = "#C41E3A";
const DORADO = "#A8172E"; // rojo CSN profundo (cero dorado)
const CREMA = "#F5F0E8";
const NEGRO = "#1a1a1a";
const MUTED = "#6B5E54";
const LOGO = "https://carnesn.ink/icons/icon-192.png";

function emailLayout(opts: {
  preheader?: string;
  eyebrow?: string;
  titulo: string;
  cuerpoHtml: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  const { preheader = "", eyebrow = "", titulo, cuerpoHtml, ctaText, ctaHref } = opts;
  const cta =
    ctaText && ctaHref
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td bgcolor="${ROJO}" style="border-radius:12px">
          <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px">${ctaText}</a>
        </td></tr></table>`
      : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:${CREMA};">
  <span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #eadfce">
        <!-- header -->
        <tr><td style="background:${ROJO};padding:22px 28px" align="left">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px"><img src="${LOGO}" width="40" height="40" alt="CSN" style="display:block;border-radius:8px"/></td>
            <td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff">
              <div style="font-size:18px;font-weight:bold;letter-spacing:.02em">CSN</div>
              <div style="font-size:12px;color:#ffe9c9">Carnes Selectas Nayarit</div>
            </td>
          </tr></table>
        </td></tr>
        <!-- gold rule -->
        <tr><td style="height:4px;background:${DORADO};line-height:4px;font-size:0">&nbsp;</td></tr>
        <!-- body -->
        <tr><td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:${NEGRO}">
          ${eyebrow ? `<div style="font-size:11px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:${ROJO};margin-bottom:8px">${eyebrow}</div>` : ""}
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${NEGRO}">${titulo}</h1>
          ${cuerpoHtml}
          ${cta}
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:20px 28px;background:${CREMA};font-family:Arial,Helvetica,sans-serif;color:${MUTED};font-size:12px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <a href="https://carnesn.ink/catalogo" style="color:${MUTED};text-decoration:none">Catálogo</a> &nbsp;·&nbsp;
              <a href="https://carnesn.ink/sucursales" style="color:${MUTED};text-decoration:none">Sucursales</a> &nbsp;·&nbsp;
              <a href="https://carnesn.ink/app/recompensas" style="color:${MUTED};text-decoration:none">Recompensas</a>
            </td>
          </tr></table>
          <div style="margin-top:10px">© ${new Date().getFullYear()} CSN — Carnes Selectas Nayarit · Nayarit · Sinaloa · Jalisco</div>
          <div style="margin-top:4px">Recibes este correo porque tienes una cuenta en carnesn.ink</div>
        </td></tr>
      </table>
      <div style="font-family:Arial,Helvetica,sans-serif;color:${MUTED};font-size:11px;margin-top:14px">carnesn.ink</div>
    </td></tr>
  </table></body></html>`;
}

export function welcomeEmail(nombre?: string | null) {
  const hola = nombre ? `Hola ${nombre}, ` : "";
  return emailLayout({
    preheader: "Tu cuenta del Club CSN está lista. Acumula puntos en cada compra.",
    eyebrow: "Bienvenido al club",
    titulo: "¡Ya eres parte del Club CSN! 🥩",
    cuerpoHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${NEGRO}">${hola}tu cuenta del <b>Club Carnes Selectas Nayarit</b> está lista.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${MUTED}">Suma puntos en cada compra escaneando tu <b>QR de membresía</b> en caja, sube de nivel y canjéalos por recompensas en tu carnicería favorita.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">
        <tr>
          <td style="padding:10px 14px;background:${CREMA};border-radius:10px;font-size:13px;color:${NEGRO}">🥩 Cortes selectos</td>
          <td style="width:8px">&nbsp;</td>
          <td style="padding:10px 14px;background:${CREMA};border-radius:10px;font-size:13px;color:${NEGRO}">🎁 Recompensas</td>
          <td style="width:8px">&nbsp;</td>
          <td style="padding:10px 14px;background:${CREMA};border-radius:10px;font-size:13px;color:${NEGRO}">📍 24 sucursales</td>
        </tr>
      </table>`,
    ctaText: "Ver mi panel y mi QR",
    ctaHref: "https://carnesn.ink/app/dashboard",
  });
}

export function notificacionEmail(titulo: string, mensaje: string) {
  const safe = mensaje.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return emailLayout({
    preheader: mensaje.slice(0, 90),
    eyebrow: "Aviso CSN",
    titulo,
    cuerpoHtml: `<p style="margin:0;font-size:15px;line-height:1.6;color:${MUTED};white-space:pre-line">${safe}</p>`,
    ctaText: "Abrir mi panel",
    ctaHref: "https://carnesn.ink/app/notificaciones",
  });
}

export function pedidoEmail(folio: string, total: string, estado: string) {
  return emailLayout({
    preheader: `Tu pedido ${folio} — ${estado}`,
    eyebrow: "Actualización de pedido",
    titulo: `Pedido ${folio}`,
    cuerpoHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;border:1px solid #eadfce;border-radius:12px">
        <tr>
          <td style="padding:14px 16px;font-size:14px;color:${MUTED}">Estado</td>
          <td style="padding:14px 16px;font-size:14px;font-weight:bold;color:${ROJO};text-align:right">${estado}</td>
        </tr>
        <tr><td colspan="2" style="border-top:1px solid #eadfce;line-height:0;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:14px 16px;font-size:14px;color:${MUTED}">Total</td>
          <td style="padding:14px 16px;font-size:18px;font-weight:bold;color:${NEGRO};text-align:right">${total}</td>
        </tr>
      </table>`,
    ctaText: "Ver mi pedido",
    ctaHref: "https://carnesn.ink/app/pedido",
  });
}

