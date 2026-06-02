"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, isAdmin } from "@/lib/auth";
import type { user_role } from "@prisma/client";

/** Admin-only: invite a worker by email with a preset role. Clerk emails the
 *  invitation; on sign-up the webhook seeds the role from publicMetadata. */
export async function invitarStaff(email: string, rol: user_role) {
  const admin = await requireAdmin();
  if (!isAdmin(admin.rol)) return { ok: false, error: "Solo administradores pueden invitar." };
  const correo = email?.trim().toLowerCase();
  if (!correo || !correo.includes("@")) return { ok: false, error: "Email inválido." };

  try {
    const client = await clerkClient();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://carnesn.ink";
    await client.invitations.createInvitation({
      emailAddress: correo,
      publicMetadata: { role: rol },
      redirectUrl: `${base}/sign-up`,
      ignoreExisting: true,
    });
    return { ok: true };
  } catch (e) {
    const msg =
      (e as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
      (e as Error)?.message ??
      "No se pudo enviar la invitación.";
    return { ok: false, error: msg };
  }
}
