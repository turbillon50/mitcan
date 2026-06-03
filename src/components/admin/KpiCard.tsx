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
    <div className="card relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-primary" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-on-bg-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-on-bg-muted">{hint}</p>}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}
