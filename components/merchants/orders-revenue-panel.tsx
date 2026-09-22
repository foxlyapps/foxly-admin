"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  Globe2,
  Workflow,
  ShieldCheck,
  Percent,
  Tag,
  Layers,
  IndianRupee,
  Receipt,
  Repeat,
  AlertTriangle,
  Ban,
  MapPin,
} from "lucide-react";
import type { RangePreset } from "@/lib/analytics/ranges";
import type { MerchantOrderStats, MerchantJsonInsights, MerchantOpsInsights } from "@/lib/merchants/queries";
import { fetchMerchantPerformance } from "@/lib/merchants/actions";
import { formatCompactCurrency, formatIndianWords, formatNumber, formatPercent } from "@/lib/analytics/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Donut } from "@/components/analytics/donut";
import { BarList } from "@/components/analytics/bar-list";
import { cn } from "@/lib/utils";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "current_month", label: "Monthly" },
  { value: "current_year", label: "Yearly" },
];

export function OrdersRevenuePanel({
  shopDomain,
  initial,
  initialInsights,
  initialOps,
}: {
  shopDomain: string;
  initial: MerchantOrderStats;
  initialInsights: MerchantJsonInsights;
  initialOps: MerchantOpsInsights;
}) {
  const [data, setData] = useState(initial);
  const [insights, setInsights] = useState(initialInsights);
  const [ops, setOps] = useState(initialOps);
  const [mode, setMode] = useState<RangePreset | "custom">("last_30_days");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();

  function selectPreset(preset: RangePreset) {
    setMode(preset);
    startTransition(async () => {
      const result = await fetchMerchantPerformance(shopDomain, preset);
      setData(result.orderStats);
      setInsights(result.insights);
      setOps(result.ops);
    });
  }

  function applyCustom() {
    if (!from || !to) return;
    setMode("custom");
    startTransition(async () => {
      const result = await fetchMerchantPerformance(shopDomain, {
        from: new Date(from).toISOString(),
        to: new Date(new Date(to).getTime() + 86_400_000).toISOString(),
      });
      setData(result.orderStats);
      setInsights(result.insights);
      setOps(result.ops);
    });
  }

  const rows: { key: keyof Pick<MerchantOrderStats, "paid" | "partial" | "cod">; label: string }[] = [
    { key: "paid", label: "Paid" },
    { key: "partial", label: "Partial" },
    { key: "cod", label: "COD" },
  ];

  const rateTiles = [
    { icon: ShieldCheck, label: "OTP verified", value: insights.otpVerifiedRate },
    { icon: Tag, label: "Coupon adoption", value: insights.discountAdoptionRate },
    { icon: Layers, label: "Upsell attach", value: insights.upsellAttachRate },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle className="flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-brand-600" />
            Orders & Revenue
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => selectPreset(p.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === p.value
                    ? "bg-brand-600 text-white"
                    : "bg-surface-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <Input type="date" className="h-8 w-[130px] text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="date" className="h-8 w-[130px] text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
              <Button size="sm" variant="outline" onClick={applyCustom} disabled={!from || !to}>
                Apply
              </Button>
            </div>
            {pending && <Loader2 className="h-4 w-4 animate-spin text-brand-600" />}
          </div>
        </CardHeader>
        <CardContent className={cn("transition-opacity", pending && "opacity-60")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rows.map((r) => (
              <div key={r.key} className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-muted-foreground">{r.label}</p>
                <p
                  className="mt-1.5 w-fit cursor-default text-xl font-semibold tabular-nums text-foreground"
                  title={formatIndianWords(data[r.key].revenue)}
                >
                  {formatCompactCurrency(data[r.key].revenue, "INR")}
                </p>
                <p className="text-xs text-muted-foreground">{formatNumber(data[r.key].orders)} orders</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span
              className="w-fit cursor-default font-semibold tabular-nums text-foreground"
              title={formatIndianWords(data.total.revenue)}
            >
              {formatCompactCurrency(data.total.revenue, "INR")} · {formatNumber(data.total.orders)} orders
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("transition-opacity", pending && "opacity-60")}>
        <CardHeader>
          <CardTitle>Actionable insights</CardTitle>
          <p className="text-xs text-muted-foreground">Operational health for the selected range</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="h-4 w-4" />
                <span className="text-sm font-medium">Avg. order value</span>
              </div>
              <p className="mt-1.5 w-fit cursor-default text-xl font-semibold tabular-nums text-foreground" title={formatIndianWords(ops.aov)}>
                {formatCompactCurrency(ops.aov, "INR")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Repeat className="h-4 w-4" />
                <span className="text-sm font-medium">Repeat order rate</span>
              </div>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                {formatPercent(ops.repeatCustomerRate, 1)}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border p-4",
                ops.syncFailedCount > 0
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                  : "border-border",
              )}
            >
              <div className={cn("flex items-center gap-2", ops.syncFailedCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Sync failures</span>
              </div>
              <p className={cn("mt-1.5 text-xl font-semibold tabular-nums", ops.syncFailedCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                {formatNumber(ops.syncFailedCount)}
              </p>
              {ops.syncFailedCount > 0 && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                  {formatPercent(ops.syncFailedRate, 1)} of orders — check Shopify sync
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ban className="h-4 w-4" />
                <span className="text-sm font-medium">Cancellation rate</span>
              </div>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                {formatPercent(ops.cancellationRate, 1)}
              </p>
            </div>
          </div>

          {ops.topCities.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-brand-600" />
                Top delivery cities
              </div>
              <BarList data={ops.topCities} currency="INR" showRevenue />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn("transition-opacity", pending && "opacity-60")}>
        <CardHeader>
          <CardTitle>Store performance</CardTitle>
          <p className="text-xs text-muted-foreground">
            Parsed from checkout snapshots ({formatNumber(insights.sampledOrders)} orders with data)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rateTiles.map((t) => (
              <div key={t.label} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <t.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.label}</span>
                </div>
                <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
                  {formatPercent(t.value, 1)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe2 className="h-4 w-4 text-brand-600" />
                Orders by detected country
              </div>
              <Donut data={insights.byCountry} />
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Workflow className="h-4 w-4 text-brand-600" />
                Orders by checkout source
              </div>
              <BarList data={insights.byOrderSource} currency="INR" />
            </div>
          </div>

          {insights.avgDiscountPercent > 0 && (
            <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
              <Percent className="h-4 w-4" />
              Avg. discount on discounted orders: <span className="font-medium text-foreground">{formatPercent(insights.avgDiscountPercent, 1)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
