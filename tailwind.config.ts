import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSN — paleta de marca aprobada: rojo + crema (CERO dorado).
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--surface-3) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "on-bg": "rgb(var(--on-bg) / <alpha-value>)",
        "on-bg-muted": "rgb(var(--on-bg-muted) / <alpha-value>)",
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / 0.12)",
        negro: "#1a1a1a",
        brand: {
          red: "#C41E3A",
          redDeep: "#A8172E",
          crema: "#F5F0E8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
        "3xl": "30px",
      },
      boxShadow: {
        card: "0 12px 28px -14px rgba(100,30,15,0.18), 0 2px 6px -3px rgba(100,30,15,0.08)",
        glow: "0 0 18px rgba(196,30,58,0.28)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
