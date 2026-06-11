"use client";

import { useId, useState } from "react";
import type { AppTimePoint } from "@/lib/analytics/queries";

interface InstallChartProps {
  data: AppTimePoint[];
  bucket: "hour" | "day" | "week" | "month";
}

/** Dual bar chart: installs (up, brand) vs uninstalls (down, red). */
export function InstallChart({ data, bucket }: InstallChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);

  const width = 800;
  const height = 240;
  const padX = 12;
  const padTop = 16;
  const padBottom = 28;
  const mid = padTop + (height - padTop - padBottom) / 2;

  const n = data.length;
  const maxUp = Math.max(1, ...data.map((d) => d.installs));
  const maxDown = Math.max(1, ...data.map((d) => d.uninstalls));
  const halfH = (height - padTop - padBottom) / 2;

  const slot = (width - padX * 2) / Math.max(1, n);
  const barW = Math.min(18, slot * 0.6);

  const cx = (i: number) => padX + slot * i + slot / 2;
  const tickEvery = Math.max(1, Math.ceil(n / 7));

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <line
          x1={padX}
          x2={width - padX}
          y1={mid}
          y2={mid}
          stroke="var(--border-strong)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const upH = (d.installs / maxUp) * halfH;
          const downH = (d.uninstalls / maxDown) * halfH;
          const active = hover === i;
          return (
            <g key={`${id}-${i}`}>
              {/* installs (up) */}
              <rect
                x={cx(i) - barW / 2}
                y={mid - upH}
                width={barW}
                height={upH}
                rx={3}
                fill="var(--color-brand-600)"
                opacity={active || hover === null ? 1 : 0.45}
              />
              {/* uninstalls (down) */}
              <rect
                x={cx(i) - barW / 2}
                y={mid}
                width={barW}
                height={downH}
                rx={3}
                fill="oklch(0.62 0.18 25)"
                opacity={active || hover === null ? 1 : 0.45}
              />
              <rect
                x={cx(i) - slot / 2}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {(i % tickEvery === 0 || i === n - 1) && (
                <text
                  x={cx(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {formatBucket(d.bucket, bucket)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Installs
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.62 0.18 25)" }}
          />{" "}
          Uninstalls
        </span>
        {hover !== null && data[hover] && (
          <span className="font-medium text-foreground">
            {formatBucket(data[hover].bucket, bucket)}: +{data[hover].installs}{" "}
            / -{data[hover].uninstalls}
          </span>
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
