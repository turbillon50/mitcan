import { cookies } from "next/headers";
import { LANG_COOKIE, type Locale } from "./i18n";

/** Read the active locale from the cookie (server components/actions). */
export async function getLocale(): Promise<Locale> {
  try {
    const c = await cookies();
    return c.get(LANG_COOKIE)?.value === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}
