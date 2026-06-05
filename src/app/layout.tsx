import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { getLocale } from "@/lib/i18n-server";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('csn-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "CSN — Carnes Selectas Nayarit",
  description:
    "CSN Carnes Selectas Nayarit — club de recompensas, catálogo y sucursales en Nayarit, Sinaloa y Jalisco.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://carnesn.ink"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CSN",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon-180.png",
  },
};

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
  const locale = await getLocale();
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
          colorPrimary: "#E87020",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorText: "#1A0A05",
          colorTextSecondary: "#7A5040",
          colorInputText: "#1A0A05",
          borderRadius: "12px",
        },
      }}
    >
      <html lang={locale}>
        <head>
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
          <ServiceWorkerRegistrar />
        </body>
      </html>
    </ClerkProvider>
  );
}
