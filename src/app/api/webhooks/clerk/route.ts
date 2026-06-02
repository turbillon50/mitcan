import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail } from "@/lib/resend";
import type { user_role } from "@prisma/client";

type ClerkEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { id: string; email_address: string }[];
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    public_metadata?: { role?: user_role };
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SIGNING_SECRET not set" },
      { status: 500 }
    );
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("[CSN] Clerk webhook verify failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;

  try {
    if (type === "user.created" || type === "user.updated") {
      const primary =
        data.email_addresses?.find((e) => e.id === data.primary_email_address_id) ??
        data.email_addresses?.[0];
      const email = primary?.email_address ?? null;
      const nombre =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        data.username ||
        null;
      const rol = data.public_metadata?.role ?? "cliente";

      const existing = await prisma.users.findUnique({
        where: { clerk_id: data.id },
      });

      if (existing) {
        await prisma.users.update({
          where: { clerk_id: data.id },
          data: { email, nombre },
        });
      } else {
        await prisma.users.create({
          data: { clerk_id: data.id, email, nombre, rol },
        });
        if (email) {
          await sendEmail({
            to: email,
            subject: "¡Bienvenido al Club CSN! 🥩",
            html: welcomeEmail(nombre),
          });
        }
      }
    } else if (type === "user.deleted") {
      await prisma.users
        .update({ where: { clerk_id: data.id }, data: { activo: false } })
        .catch(() => null);
    }
  } catch (err) {
    console.error("[CSN] Clerk webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
