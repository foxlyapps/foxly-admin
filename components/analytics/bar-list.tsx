"use client";

import type { Breakdown } from "@/lib/analytics/queries";
import { formatCompactCurrency, formatNumber } from "@/lib/analytics/format";

interface BarListProps {
  data: Breakdown[];
  currency: string;
  /** Show revenue instead of count as the trailing metric. */
  showRevenue?: boolean;
}

/** Ranked horizontal bar list (Vercel-style). */
export function BarList({ data, currency, showRevenue }: BarListProps) {
  const max = Math.max(1, ...data.map((d) => (showRevenue ? d.revenue : d.value)));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No data</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const metric = showRevenue ? d.revenue : d.value;
        const pct = (metric / max) * 100;
        return (
          <li key={i} className="relative">
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2">
              <div
                className="absolute inset-y-0 left-0 rounded-lg bg-brand-100 dark:bg-brand-900/30"
                style={{ width: `${Math.max(pct, 3)}%` }}
                aria-hidden
              />
              <span className="relative truncate text-sm font-medium text-foreground">
                {d.label}
              </span>
              <span className="relative shrink-0 text-sm tabular-nums text-muted-foreground">
                {showRevenue
                  ? formatCompactCurrency(d.revenue, currency)
                  : formatNumber(d.value)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
