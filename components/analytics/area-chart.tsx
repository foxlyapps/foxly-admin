"use client";

import { useId, useState } from "react";
import type { TimePoint } from "@/lib/analytics/queries";

interface AreaChartProps {
  data: TimePoint[];
  metric: "revenue" | "orders";
  currency: string;
  bucket: "hour" | "day" | "week" | "month";
}

const VIEW_W = 1000;
const VIEW_H = 300;
const PAD_TOP = 12;
const PAD_BOTTOM = 12;

/** Responsive area chart. SVG holds the geometry; labels/points are HTML overlays
 *  so they never get distorted by horizontal stretching. */
export function AreaChart({ data, metric, currency, bucket }: AreaChartProps) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const values = data.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const n = data.length;

  if (n === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No activity in this period.
      </p>
    );
  }

  // Position in fractional (0..1) space so HTML overlay aligns with SVG.
  const fx = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  const fy = (v: number) => 1 - v / max;

  // SVG coordinates.
  const sx = (i: number) => fx(i) * VIEW_W;
  const sy = (v: number) => PAD_TOP + fy(v) * (VIEW_H - PAD_TOP - PAD_BOTTOM);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${sx(i)} ${sy(d[metric])}`)
    .join(" ");
  const area = `${line} L ${sx(n - 1)} ${VIEW_H} L ${sx(0)} ${VIEW_H} Z`;

  const tickEvery = Math.max(1, Math.ceil(n / 8));

  const fmt = (v: number) =>
    metric === "revenue" ? compactCurrency(v, currency) : v.toLocaleString();

  return (
    <div className="w-full">
      <div className="relative h-64 w-full">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.30" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={0}
              x2={VIEW_W}
              y1={PAD_TOP + g * (VIEW_H - PAD_TOP - PAD_BOTTOM)}
              y2={PAD_TOP + g * (VIEW_H - PAD_TOP - PAD_BOTTOM)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
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
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Hover guideline */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-brand-400/60"
            style={{ left: `${fx(hover) * 100}%` }}
          />
        )}

        {/* Points overlay (undistorted) */}
        {data.map((d, i) => (
          <span
            key={i}
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand-600 transition-opacity"
            style={{
              left: `${fx(i) * 100}%`,
              top: `${(PAD_TOP + fy(d[metric]) * (VIEW_H - PAD_TOP - PAD_BOTTOM)) / VIEW_H * 100}%`,
              opacity: hover === i ? 1 : 0,
            }}
          />
        ))}

        {/* Hit areas */}
        <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
          {data.map((_, i) => (
            <div key={i} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
          ))}
        </div>

        {/* Tooltip */}
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${Math.min(92, Math.max(8, fx(hover) * 100))}%`,
              top: `${(PAD_TOP + fy(data[hover][metric]) * (VIEW_H - PAD_TOP - PAD_BOTTOM)) / VIEW_H * 100}%`,
            }}
          >
            <p className="font-medium text-foreground">
              {formatBucket(data[hover].bucket, bucket)}
            </p>
            <p className="text-brand-600">{fmt(data[hover][metric])}</p>
          </div>
        )}
      </div>

      {/* X axis labels (HTML, evenly spaced) */}
      <div className="relative mt-2 h-4">
        {data.map((d, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <span
              key={i}
              className="absolute -translate-x-1/2 text-[11px] text-muted-foreground"
              style={{ left: `${Math.min(97, Math.max(3, fx(i) * 100))}%` }}
            >
              {formatBucket(d.bucket, bucket)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function formatBucket(iso: string, bucket: string): string {
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return iso;
  if (bucket === "hour")
    return d.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });
  if (bucket === "month")
    return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function compactCurrency(v: number, currency: string): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}
