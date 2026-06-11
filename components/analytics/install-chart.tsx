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

  const n = data.length;
  const maxUp = Math.max(1, ...data.map((d) => d.installs));
  const maxDown = Math.max(1, ...data.map((d) => d.uninstalls));

  // Adaptive label density: ~8 labels max.
  const tickEvery = Math.max(1, Math.ceil(n / 8));

  if (n === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No install activity in this period.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="flex h-56 items-stretch gap-px">
        {data.map((d, i) => {
          const upPct = (d.installs / maxUp) * 100;
          const downPct = (d.uninstalls / maxDown) * 100;
          const active = hover === i;
          const showLabel = i % tickEvery === 0 || i === n - 1;
          return (
            <div
              key={`${id}-${i}`}
              className="group relative flex min-w-0 flex-1 flex-col"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Tooltip */}
              {active && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg">
                  <p className="font-medium text-foreground">
                    {formatBucket(d.bucket, bucket)}
                  </p>
                  <p className="text-brand-600">+{d.installs} installs</p>
                  {d.uninstalls > 0 && (
                    <p style={{ color: "oklch(0.55 0.18 25)" }}>
                      -{d.uninstalls} uninstalls
                    </p>
                  )}
                </div>
              )}

              {/* Installs (top half, grows down toward mid line) */}
              <div className="flex flex-1 items-end justify-center pb-px">
                <div
                  className="w-full max-w-[22px] rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(upPct, d.installs > 0 ? 4 : 0)}%`,
                    backgroundColor: "var(--color-brand-600)",
                    opacity: active || hover === null ? 1 : 0.4,
                  }}
                />
              </div>

              {/* Mid axis */}
              <div className="h-px w-full bg-border-strong" />

              {/* Uninstalls (bottom half, grows down) */}
              <div className="flex flex-1 items-start justify-center pt-px">
                <div
                  className="w-full max-w-[22px] rounded-b-md transition-all"
                  style={{
                    height: `${Math.max(downPct, d.uninstalls > 0 ? 4 : 0)}%`,
                    backgroundColor: "oklch(0.62 0.18 25)",
                    opacity: active || hover === null ? 1 : 0.4,
                  }}
                />
              </div>

              {/* X label */}
              <div className="mt-2 h-4 text-center text-[10px] leading-none text-muted-foreground">
                {showLabel ? formatBucket(d.bucket, bucket) : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Installs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.62 0.18 25)" }}
          />
          Uninstalls
        </span>
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
