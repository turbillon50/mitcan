"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { LANG_COOKIE } from "@/lib/i18n";
import { useLocale } from "@/components/I18nProvider";

/** Compact theme (claro/oscuro) + language (ES/EN) switch for headers. */
export default function SettingsControls({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("csn-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  function setLang(l: "es" | "en") {
    if (l === locale) return;
    document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "Modo claro" : "Modo oscuro"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-2 text-on-bg-muted transition hover:text-primary"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div className="flex items-center overflow-hidden rounded-full border border-hairline bg-surface-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setLang("es")}
          className={`px-2.5 py-1.5 transition ${locale === "es" ? "bg-primary text-white" : "text-on-bg-muted"}`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2.5 py-1.5 transition ${locale === "en" ? "bg-primary text-white" : "text-on-bg-muted"}`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
