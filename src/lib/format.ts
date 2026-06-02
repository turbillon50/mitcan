export function formatMXN(value: number | string | { toString(): string } | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("es-MX").format(Number(value ?? 0));
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPhone(p?: string | null): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return p;
}

/** Convert Prisma Decimal / Date values into plain JSON-safe values for client components. */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) =>
      typeof v === "bigint" ? Number(v) : v
    )
  );
}

export const ESTADOS_PEDIDO = [
  "pendiente",
  "confirmado",
  "en_camino",
  "entregado",
  "cancelado",
] as const;

export const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  confirmado: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  en_camino: "bg-primary/15 text-primary border-primary/25",
  entregado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  cancelado: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};
