"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { formatDelta } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number | null;
  icon: LucideIcon;
  /** When true, a negative delta is considered good (e.g. refunds). */
  invertDelta?: boolean;
}

export function KpiCard({ label, value, delta, icon: Icon, invertDelta }: KpiCardProps) {
  const d = formatDelta(delta);
  const good =
    d.positive === null ? null : invertDelta ? !d.positive : d.positive;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
            good === null && "bg-surface-muted text-muted-foreground",
            good === true && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
            good === false && "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
          )}
        >
          {d.positive === null ? (
            <Minus className="h-3 w-3" />
          ) : d.positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {d.text}
        </span>
        <span className="text-muted-foreground">vs previous period</span>
      </div>
    </div>
  );
}
