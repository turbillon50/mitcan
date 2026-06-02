import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { user_role } from "@prisma/client";

// Owner emails that are always promoted to admin on sign-in.
const ADMIN_EMAILS = (process.env.CSN_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function noAdminExists() {
  try {
    return (await prisma.users.count({ where: { rol: "admin" } })) === 0;
  } catch {
    return false;
  }
}

/**
 * Resolve (and lazily provision) the local `users` row for the signed-in
 * Clerk user. The DB is the source of truth for roles & points; Clerk
 * publicMetadata.role seeds the role on first sign-in.
 *
 * Admin bootstrap: the very first account (or any email in CSN_ADMIN_EMAILS)
 * becomes `admin`, so the owner can reach /admin and invite the rest of the
 * staff. Once an admin exists, new accounts default to `cliente`.
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let dbUser = await prisma.users.findUnique({ where: { clerk_id: userId } });

  if (!dbUser) {
    // Provision on first sign-in (the Clerk webhook normally does this, but we
    // fall back here so the app works even before the webhook fires).
    const cu = await currentUser();
    const email =
      cu?.primaryEmailAddress?.emailAddress ??
      cu?.emailAddresses?.[0]?.emailAddress ??
      null;
    const nombre =
      [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.username || null;

    let rol = (cu?.publicMetadata?.role as user_role | undefined) ?? "cliente";
    if (email && ADMIN_EMAILS.includes(email.toLowerCase())) rol = "admin";
    else if (rol === "cliente" && (await noAdminExists())) rol = "admin";

    try {
      // users.id is a (non-defaulted) text PK; we key it to the Clerk user id.
      dbUser = await prisma.users.upsert({
        where: { clerk_id: userId },
        update: {},
        create: { id: userId, clerk_id: userId, email, nombre, rol },
      });
    } catch {
      // If email collides with an existing row, link it instead.
      if (email) {
        dbUser = await prisma.users.update({
          where: { email },
          data: { clerk_id: userId },
        });
      }
    }
  }

  // Promote owner emails, or bootstrap the first admin if none exists yet.
  if (dbUser && dbUser.rol !== "admin") {
    const email = dbUser.email?.toLowerCase();
    const isOwnerEmail = !!email && ADMIN_EMAILS.includes(email);
    const isBootstrap = !isStaff(dbUser.rol) && (await noAdminExists());
    if (isOwnerEmail || isBootstrap) {
      dbUser = await prisma.users.update({
        where: { id: dbUser.id },
        data: { rol: "admin" },
      });
    }
  }

  return dbUser;
}

export async function requireUser() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  return user;
}

const STAFF_ROLES: user_role[] = ["admin", "gerente", "empleado"];
const ADMIN_ROLES: user_role[] = ["admin", "gerente"];

export function isStaff(rol?: user_role | null) {
  return !!rol && STAFF_ROLES.includes(rol);
}

export function isAdmin(rol?: user_role | null) {
  return !!rol && ADMIN_ROLES.includes(rol);
}

/** Non-redirecting guard for route handlers. Returns the staff user or null. */
export async function getStaffOrNull() {
  const user = await getCurrentDbUser();
  return user && isStaff(user.rol) ? user : null;
}

/** Guard server components / actions under /admin. */
export async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (!isStaff(user.rol)) redirect("/app/dashboard");
  return user;
}
