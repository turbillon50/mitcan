import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { getLocale } from "@/lib/i18n-server";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import CanvasPreviewBridge from "@/components/CanvasPreviewBridge";
import { getContent } from "@/lib/data";
import { buildBrandCss, mergeBrand, type BrandContent } from "@/lib/brand-content";

const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('csn-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const brand = mergeBrand(await getContent<BrandContent>("brand"));
  return {
    title: `${brand.appName} — ${brand.tagline}`,
    description: `${brand.appName} — ${brand.tagline}. Club de recompensas, catálogo y sucursales.`,
    manifest: "/manifest.webmanifest",
    metadataBase: new URL("https://carnesn.ink"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brand.appName,
    },
    icons: {
      icon: [
        { url: brand.iconUrl },
        { url: "/icons/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: brand.iconUrl || "/icons/apple-touch-icon-180.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, brand] = await Promise.all([
    getLocale(),
    getContent<BrandContent>("brand").then(mergeBrand),
  ]);
  return (
    <ClerkProvider
      localization={locale === "en" ? undefined : esES}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/app/onboarding"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: brand.colors.primary,
          colorBackground: brand.colors.surface,
          colorInputBackground: brand.colors.surface,
          colorText: brand.colors.text,
          colorTextSecondary: brand.colors.muted,
          colorInputText: brand.colors.text,
          borderRadius: "12px",
        },
      }}
    >
      <html lang={locale}>
        <head>
          <style dangerouslySetInnerHTML={{ __html: buildBrandCss(brand) }} />
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700;800&display=swap"
          />
        </head>
        <body>
          <I18nProvider locale={locale}>{children}</I18nProvider>
          <CanvasPreviewBridge />
          <ServiceWorkerRegistrar />
        </body>
      </html>
    </ClerkProvider>
  );
}
