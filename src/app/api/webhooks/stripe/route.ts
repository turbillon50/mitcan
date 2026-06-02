import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmail, pedidoEmail } from "@/lib/resend";
import { formatMXN } from "@/lib/format";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const sig = (await headers()).get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", webhookSecret);
  } catch (err) {
    console.error("[CSN] Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const pedidoId = session.metadata?.pedido_id
        ? parseInt(session.metadata.pedido_id)
        : null;

      if (pedidoId) {
        const pedido = await prisma.pedidos.update({
          where: { id: pedidoId },
          data: { estado: "confirmado" },
          include: { user: true },
        });
        if (pedido.user?.email) {
          await sendEmail({
            to: pedido.user.email,
            subject: `Pedido ${pedido.folio ?? `#${pedido.id}`} confirmado`,
            html: pedidoEmail(
              pedido.folio ?? `#${pedido.id}`,
              formatMXN(Number(pedido.total)),
              "Confirmado"
            ),
          });
        }
      }
    }
  } catch (err) {
    console.error("[CSN] Stripe handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
