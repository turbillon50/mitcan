"use client";

import { useTransition } from "react";

export default function InlineSelect({
  value,
  options,
  action,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  action: (next: string) => Promise<void>;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        start(() => action(next));
      }}
      className={`rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5 text-xs text-on-bg outline-none focus:border-primary/50 disabled:opacity-50 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
