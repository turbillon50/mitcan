import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public: landing, catalogo, sucursales, auth pages, webhooks, static.
const isPublicRoute = createRouteMatcher([
  "/",
  "/catalogo(.*)",
  "/sucursales(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Protected (need a Clerk session): /app/* (usuario) and /m/* (member scan).
const isProtectedRoute = createRouteMatcher(["/app(.*)", "/m/(.*)"]);

// Admin lives behind its own independent secret link + key, on top of the
// Clerk role check done in the /admin layout.
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const ADMIN_KEY = process.env.CSN_ADMIN_KEY ?? "mitcan";
const ADMIN_COOKIE = "csn_ak";

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const url = req.nextUrl;
    const provided = url.searchParams.get("k");
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    const hasKey = provided === ADMIN_KEY || cookie === ADMIN_KEY;

    // Without the key the admin area is invisible (looks like the public site).
    if (!hasKey) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      const target = url.pathname + (provided ? `?k=${provided}` : "");
      signIn.searchParams.set("redirect_url", target);
      const res = NextResponse.redirect(signIn);
      if (provided === ADMIN_KEY) {
        res.cookies.set(ADMIN_COOKIE, ADMIN_KEY, cookieOpts());
      }
      return res;
    }

    // Persist the key as a cookie and drop it from the URL bar.
    if (provided === ADMIN_KEY) {
      const clean = new URL(url);
      clean.searchParams.delete("k");
      const res = NextResponse.redirect(clean);
      res.cookies.set(ADMIN_COOKIE, ADMIN_KEY, cookieOpts());
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
