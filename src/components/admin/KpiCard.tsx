import type { LucideIcon } from "lucide-react";

export default function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-bg-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-on-bg-muted">{hint}</p>}
    </div>
  );
}
