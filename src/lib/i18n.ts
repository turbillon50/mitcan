// Lightweight i18n: a flat dictionary + a pure `t()`. Default locale: Spanish.
// Server components read the locale via lib/i18n-server; client components via
// the I18nProvider / useT hook.

export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";
export const LANG_COOKIE = "csn-lang";

type Dict = Record<string, string>;

const es: Dict = {
  // Header / nav
  "nav.catalog": "Catálogo",
  "nav.branches": "Sucursales",
  "nav.signin": "Entrar",
  "nav.join": "Únete al club",
  "nav.dashboard": "Mi panel",
  "brand.tagline": "Carnes Selectas",
  // Bottom nav
  "bn.home": "Inicio",
  "bn.catalog": "Catálogo",
  "bn.orders": "Pedidos",
  "bn.branches": "Sucursales",
  "bn.rewards": "Premios",
  // Catálogo
  "cat.title": "Catálogo",
  "cat.searchPlaceholder": "Buscar por producto, categoría o código…",
  "cat.all": "Todos",
  "cat.products": "productos",
  "cat.result": "resultado",
  "cat.results": "resultados",
  "cat.noResults": "No encontramos productos para",
  "cat.clear": "Limpiar filtros",
  "cat.seeMore": "Ver más",
  "cat.remaining": "restantes",
  "cat.code": "Código",
  "cat.findAtBranch": "Encuéntralo en tu sucursal",
  "cat.new": "NUEVO",
  "cat.product": "Producto",
  // Notificaciones
  "notif.title": "Notificaciones",
  "notif.subtitle": "Avisos, promociones y novedades del Club CSN",
  "notif.empty": "Aún no tienes notificaciones.",
  // Sucursales
  "suc.title": "Sucursales",
  "suc.searchPlaceholder": "Busca tu sucursal (nombre, colonia, ciudad)…",
  "suc.none": "No encontramos sucursales.",
  "suc.whatsapp": "WhatsApp",
  "suc.directions": "Cómo llegar",
  // Ajustes
  "settings.theme": "Tema",
  "settings.language": "Idioma",
  "settings.light": "Claro",
  "settings.dark": "Oscuro",
};

const en: Dict = {
  "nav.catalog": "Catalog",
  "nav.branches": "Branches",
  "nav.signin": "Sign in",
  "nav.join": "Join the club",
  "nav.dashboard": "My dashboard",
  "brand.tagline": "Selected Meats",
  "bn.home": "Home",
  "bn.catalog": "Catalog",
  "bn.orders": "Orders",
  "bn.branches": "Branches",
  "bn.rewards": "Rewards",
  "cat.title": "Catalog",
  "cat.searchPlaceholder": "Search by product, category or code…",
  "cat.all": "All",
  "cat.products": "products",
  "cat.result": "result",
  "cat.results": "results",
  "cat.noResults": "No products found for",
  "cat.clear": "Clear filters",
  "cat.seeMore": "See more",
  "cat.remaining": "left",
  "cat.code": "Code",
  "cat.findAtBranch": "Find it at your branch",
  "cat.new": "NEW",
  "cat.product": "Product",
  "notif.title": "Notifications",
  "notif.subtitle": "Alerts, promotions and CSN Club news",
  "notif.empty": "You don't have any notifications yet.",
  "suc.title": "Branches",
  "suc.searchPlaceholder": "Find your branch (name, neighborhood, city)…",
  "suc.none": "No branches found.",
  "suc.whatsapp": "WhatsApp",
  "suc.directions": "Directions",
  "settings.theme": "Theme",
  "settings.language": "Language",
  "settings.light": "Light",
  "settings.dark": "Dark",
};

export const DICT: Record<Locale, Dict> = { es, en };

export function t(locale: Locale, key: string): string {
  return DICT[locale]?.[key] ?? DICT.es[key] ?? key;
}
