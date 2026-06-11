"use client";

import { useId } from "react";
import type { Breakdown } from "@/lib/analytics/queries";
import { CHART_COLORS, formatNumber, formatPercent } from "@/lib/analytics/format";

interface DonutProps {
  data: Breakdown[];
  label?: string;
}

/** Dependency-free donut chart with legend. */
export function Donut({ data }: DonutProps) {
  const id = useId();
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 160;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const fracs = data.map((d) => (total ? d.value / total : 0));
  const segments = data.map((d, i) => {
    const cumulative = fracs.slice(0, i).reduce((s, f) => s + f, 0);
    const frac = fracs[i];
    return {
      color: CHART_COLORS[i % CHART_COLORS.length],
      dash: frac * c,
      gap: c - frac * c,
      offset: -cumulative * c,
      frac,
      label: d.label,
      value: d.value,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--surface-muted)"
              strokeWidth={stroke}
            />
            {segments.map((s, i) => (
              <circle
                key={`${id}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {formatNumber(total)}
          </span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2 self-stretch">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 truncate text-foreground">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatNumber(s.value)}
            </span>
            <span className="w-12 text-right tabular-nums font-medium text-foreground">
              {formatPercent(s.frac * 100, 0)}
            </span>
          </li>
        ))}
        {segments.length === 0 && (
          <li className="text-sm text-muted-foreground">No data</li>
        )}
      </ul>
    </div>
  );
}
