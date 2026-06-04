"use client";

import { createContext, useContext } from "react";
import { t as translate, type Locale } from "@/lib/i18n";

const LocaleCtx = createContext<Locale>("es");

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleCtx);
}

/** Returns a translator bound to the current locale. */
export function useT() {
  const locale = useContext(LocaleCtx);
  return (key: string) => translate(locale, key);
}
