"use client";

import { useId, useState } from "react";
import type { TimePoint } from "@/lib/analytics/queries";

interface AreaChartProps {
  data: TimePoint[];
  metric: "revenue" | "orders";
  currency: string;
  bucket: "hour" | "day" | "week" | "month";
}

/** Dependency-free responsive area chart with hover tooltip. */
export function AreaChart({ data, metric, currency, bucket }: AreaChartProps) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const width = 800;
  const height = 260;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;

  const values = data.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const n = data.length;

  const x = (i: number) =>
    padX + (i / Math.max(1, n - 1)) * (width - padX * 2);
  const y = (v: number) =>
    padTop + (1 - v / max) * (height - padTop - padBottom);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[metric])}`)
    .join(" ");
  const area = `${line} L ${x(n - 1)} ${height - padBottom} L ${x(0)} ${height - padBottom} Z`;

  const fmt = (v: number) =>
    metric === "revenue"
      ? formatCurrencyShort(v, currency)
      : v.toLocaleString();

  const labelFor = (iso: string) => formatBucket(iso, bucket);

  // Choose a sparse set of x-axis ticks.
  const tickEvery = Math.max(1, Math.ceil(n / 7));

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={width - padX}
            y1={padTop + g * (height - padTop - padBottom)}
            y2={padTop + g * (height - padTop - padBottom)}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}

        {n > 1 && <path d={area} fill={`url(#${gradId})`} />}
        {n > 1 && (
          <path
            d={line}
            fill="none"
            stroke="var(--color-brand-600)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* points + hover hit-areas */}
        {data.map((d, i) => (
          <g key={i}>
            {hover === i && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={padTop}
                y2={height - padBottom}
                stroke="var(--color-brand-400)"
                strokeWidth={1}
              />
            )}
            <circle
              cx={x(i)}
              cy={y(d[metric])}
              r={hover === i ? 4 : 0}
              fill="var(--color-brand-600)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
            <rect
              x={x(i) - (width - padX * 2) / Math.max(1, n - 1) / 2}
              y={0}
              width={(width - padX * 2) / Math.max(1, n - 1)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}

        {/* x labels */}
        {data.map((d, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text
              key={`t${i}`}
              x={x(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {labelFor(d.bucket)}
            </text>
          ) : null,
        )}
      </svg>

      {/* tooltip */}
      <div className="mt-2 h-5 text-center text-xs text-muted-foreground">
        {hover !== null && data[hover] ? (
          <span>
            <span className="font-medium text-foreground">
              {labelFor(data[hover].bucket)}
            </span>
            {" · "}
            {fmt(data[hover][metric])}{" "}
            {metric === "revenue" ? "revenue" : "orders"}
          </span>
        ) : (
          <span>Hover the chart for details</span>
        )}
      </div>
    </div>
  );
}

function formatBucket(iso: string, bucket: string): string {
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return iso;
  if (bucket === "hour")
    return d.toLocaleTimeString(undefined, { hour: "numeric" });
  if (bucket === "month")
    return d.toLocaleDateString(undefined, { month: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrencyShort(v: number, currency: string): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}
