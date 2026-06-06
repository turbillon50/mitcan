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

// Protected (need a Clerk session): /app/* (usuario) and /m/* (member scan).
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/m/(.*)",
  "/pedido/checkout(.*)",
  "/pedido/confirmado(.*)",
  "/pedido/seguimiento(.*)",
]);

// Admin lives behind its own independent secret magic-link token, on top of the
// Clerk role check done in the /admin layout.
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const url = req.nextUrl;
    const provided = url.searchParams.get("k");
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    const providedValid = await isValidAdminKey(provided);
    const hasKey = providedValid || (await isValidAdminKey(cookie));

    // Without the token the admin area is invisible (looks like the public site).
    if (!hasKey) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      // SECURITY: never echo the secret token (`k`) into redirect_url — that
      // would leak admin access to anyone the URL is shared with. Persist it as
      // an httpOnly cookie instead and redirect to a clean path.
      signIn.searchParams.set("redirect_url", url.pathname);
      const res = NextResponse.redirect(signIn);
      if (providedValid && provided) {
        res.cookies.set(ADMIN_COOKIE, provided, cookieOpts());
      }
      return res;
    }

    // Persist the token as a cookie and drop it from the URL bar.
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
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
