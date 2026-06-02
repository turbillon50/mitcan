import { ESTADO_COLOR, ESTADO_LABEL } from "@/lib/format";

export default function StatusBadge({ estado }: { estado: string }) {
  const cls =
    ESTADO_COLOR[estado] ?? "bg-surface-3 text-on-bg-muted border-hairline";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}
