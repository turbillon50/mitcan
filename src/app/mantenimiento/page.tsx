import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "En mantenimiento — CSN Carnes Selectas",
  robots: { index: false, follow: false },
};

export default function MantenimientoPage() {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            padding: "2rem",
            textAlign: "center",
            background: "#faf7f2",
            color: "#1a1a1a",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(196,30,58,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
            }}
          >
            🔧
          </div>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#C41E3A" }}>
              Estamos en mantenimiento
            </h1>
            <p style={{ marginTop: "0.6rem", maxWidth: 420, color: "#6b7280", lineHeight: 1.5 }}>
              Estamos haciendo mejoras en nuestra aplicación. Volvemos muy pronto.
              Gracias por tu paciencia.
            </p>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#9aa0a6", marginTop: "1rem" }}>
            CSN · Carnes Selectas Nayarit
          </p>
        </div>
      </body>
    </html>
  );
}
