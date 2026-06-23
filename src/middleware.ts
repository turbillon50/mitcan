import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidAdminKey, ADMIN_COOKIE } from "@/lib/admin-key";

// Public: landing, catalogo, sucursales, auth pages, webhooks, static.
const isPublicRoute = createRouteMatcher([
  "/",
  "/catalogo(.*)",
  "/pedido",
  "/pedido/c/(.*)",
  "/pedido/carrito",
  "/sucursales(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/m/(.*)",
  "/pedido/checkout(.*)",
  "/pedido/confirmado(.*)",
  "/pedido/seguimiento(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Rutas siempre permitidas aun en mantenimiento (para que el admin pueda entrar
// y para que el propio aviso de mantenimiento cargue).
const isMaintenanceAllowed = createRouteMatcher([
  "/mantenimiento",
  "/admin(.*)",
  "/sign-in(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // === MODO MANTENIMIENTO ===
  // Se activa poniendo la variable de entorno MAINTENANCE_MODE=on en Vercel.
  // El público ve la página de mantenimiento; el admin (con su llave) entra normal.
  if (process.env.MAINTENANCE_MODE === "on") {
    const url = req.nextUrl;
    const hasAdminKeyParam = await isValidAdminKey(url.searchParams.get("k"));
    const hasAdminCookie = await isValidAdminKey(req.cookies.get(ADMIN_COOKIE)?.value);
    const adminBypass = hasAdminKeyParam || hasAdminCookie;

    // Si NO es admin y NO es una ruta permitida, mandar a mantenimiento.
    if (!adminBypass && !isMaintenanceAllowed(req)) {
      return NextResponse.rewrite(new URL("/mantenimiento", req.url));
    }
  }

  if (isAdminRoute(req)) {
    const url = req.nextUrl;
    const provided = url.searchParams.get("k");
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    const providedValid = await isValidAdminKey(provided);
    const hasKey = providedValid || (await isValidAdminKey(cookie));

    if (!hasKey) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", url.pathname);
      const res = NextResponse.redirect(signIn);
      if (providedValid && provided) {
        res.cookies.set(ADMIN_COOKIE, provided, cookieOpts());
      }
      return res;
    }

    if (providedValid && provided) {
      const clean = new URL(url);
      clean.searchParams.delete("k");
      const res = NextResponse.redirect(clean);
      res.cookies.set(ADMIN_COOKIE, provided, cookieOpts());
      return res;
    }
    return;
  }

  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  }
});

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
