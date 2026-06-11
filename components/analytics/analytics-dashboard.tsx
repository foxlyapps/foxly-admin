"use client";

import { useState, useTransition } from "react";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  TrendingUp,
  Loader2,
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

  const { kpi, currency } = data;

  return (
    <div className={cn("space-y-6", pending && "pointer-events-none")}>
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {formatRangeLabel(data.range.from, data.range.to)}
        </p>
        <RangeFilter value={preset} onChange={changePreset} disabled={pending} />
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
  };
  return `${f.toLocaleDateString(undefined, opts)} – ${t.toLocaleDateString(undefined, opts)}`;
}
