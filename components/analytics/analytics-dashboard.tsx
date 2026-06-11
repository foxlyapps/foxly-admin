"use client";

import { useState, useTransition } from "react";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  TrendingUp,
  Loader2,
  Calendar,
  Download,
  Power,
  Store,
  Activity,
} from "lucide-react";
import type { AnalyticsData } from "@/lib/analytics/queries";
import type { RangePreset } from "@/lib/analytics/ranges";
import { fetchAnalytics } from "@/lib/analytics/actions";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
} from "@/lib/analytics/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils";
import { RangeFilter } from "./range-filter";
import { KpiCard } from "./kpi-card";
import { AreaChart } from "./area-chart";
import { InstallChart } from "./install-chart";
import { Donut } from "./donut";
import { BarList } from "./bar-list";
import { FeatureInsightsPanel } from "./feature-insights-panel";

export function AnalyticsDashboard({ initial }: { initial: AnalyticsData }) {
  const [data, setData] = useState(initial);
  const [preset, setPreset] = useState<RangePreset>(initial.preset);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [pending, startTransition] = useTransition();

  function changePreset(next: RangePreset) {
    setPreset(next);
    startTransition(async () => {
      try {
        const result = await fetchAnalytics(next);
        setData(result);
      } catch {
        toast.error("Failed to load analytics", "Please try again.");
      }
    });
  }

  const { kpi, currency, app } = data;

  return (
    <div className={cn("space-y-8", pending && "pointer-events-none")}>
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 px-1">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          ) : (
            <Calendar className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Showing data for</p>
            <p className="text-sm font-medium text-foreground">
              {formatRangeLabel(data.range.from, data.range.to)}
            </p>
          </div>
        </div>
        <RangeFilter value={preset} onChange={changePreset} disabled={pending} />
      </div>

      {/* ---------- App health ---------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Power className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            App health
          </h2>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 gap-4 lg:grid-cols-4 transition-opacity",
            pending && "opacity-60",
          )}
        >
          <KpiCard
            label="New installs"
            value={formatNumber(app.installs)}
            delta={app.deltas.installs}
            icon={Download}
          />
          <KpiCard
            label="Uninstalls"
            value={formatNumber(app.uninstalls)}
            delta={app.deltas.uninstalls}
            icon={Power}
            invertDelta
          />
          <KpiCard
            label="Active shops"
            value={formatNumber(app.activeShops)}
            delta={app.deltas.activeShops}
            icon={Store}
          />
          <KpiCard
            label="Churn rate"
            value={`${app.churnRate.toFixed(1)}%`}
            delta={null}
            icon={Activity}
          />
        </div>

        <Card className={cn("transition-opacity", pending && "opacity-60")}>
          <CardHeader>
            <CardTitle>Installs vs uninstalls</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Net{" "}
                <span
                  className={cn(
                    "font-semibold",
                    app.netInstalls >= 0 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {app.netInstalls >= 0 ? "+" : ""}
                  {app.netInstalls}
                </span>
              </span>
              <span>
                {formatNumber(app.engagedShops)} of {formatNumber(app.activeShops)}{" "}
                active shops have orders
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <InstallChart data={data.appSeries} bucket={data.bucket} />
          </CardContent>
        </Card>
      </section>

      {/* ---------- Commerce ---------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-brand-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Merchant commerce
          </h2>
        </div>

      {/* KPI cards */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-opacity",
          pending && "opacity-60",
        )}
      >
        <KpiCard
          label="Revenue"
          value={formatCompactCurrency(kpi.revenue, currency)}
          delta={kpi.deltas.revenue}
          icon={DollarSign}
        />
        <KpiCard
          label="Orders"
          value={formatNumber(kpi.orders)}
          delta={kpi.deltas.orders}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Avg. Order Value"
          value={formatCurrency(kpi.avgOrderValue, currency)}
          delta={kpi.deltas.avgOrderValue}
          icon={Receipt}
        />
        <KpiCard
          label="Customers"
          value={formatNumber(kpi.customers)}
          delta={kpi.deltas.customers}
          icon={Users}
        />
      </div>

      {/* Trend chart */}
      <Card className={cn("transition-opacity", pending && "opacity-60")}>
        <CardHeader>
          <CardTitle>{metric === "revenue" ? "Revenue" : "Orders"} over time</CardTitle>
          <div className="flex rounded-lg border border-border p-0.5">
            {(["revenue", "orders"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  metric === m
                    ? "bg-brand-600 text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={data.series}
            metric={metric}
            currency={currency}
            bucket={data.bucket}
          />
        </CardContent>
      </Card>

      {/* Feature insights (the highlight) */}
      <Card className={cn("transition-opacity", pending && "opacity-60")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            Feature usage & insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureInsightsPanel data={data.features} currency={currency} />
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6 lg:grid-cols-2 transition-opacity",
          pending && "opacity-60",
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut data={data.byStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut data={data.byPaymentMethod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top shops by revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={data.topShops} currency={currency} showRevenue />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={data.topProducts} currency={currency} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top locations (cities)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={data.topCities} currency={currency} />
          </CardContent>
        </Card>
      </div>
      </section>
    </div>
  );
}

function formatRangeLabel(from: string, to: string): string {
  const f = new Date(from);
  const t = new Date(new Date(to).getTime() - 1);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  };
  return `${f.toLocaleDateString("en-US", opts)} – ${t.toLocaleDateString("en-US", opts)}`;
}
