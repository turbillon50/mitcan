import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSN — Carnes Selectas Nayarit",
  description:
    "CSN Carnes Selectas Nayarit — club de recompensas, catálogo y sucursales en Nayarit, Sinaloa y Jalisco.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://carnesn.ink"),
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/app/dashboard"
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
      <html lang="es">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700;800&display=swap"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
