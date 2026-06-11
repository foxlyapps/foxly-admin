"use client";

import { Sparkles, Tag } from "lucide-react";
import type { FeatureInsights } from "@/lib/analytics/queries";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  CHART_COLORS,
} from "@/lib/analytics/format";

interface FeatureInsightsPanelProps {
  data: FeatureInsights;
  currency: string;
}

export function FeatureInsightsPanel({
  data,
  currency,
}: FeatureInsightsPanelProps) {
  const { paymentMix, adoption, topFeature, discount } = data;

  return (
    <div className="space-y-5">
      {/* Headline */}
      {topFeature && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-900/20">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Most-used feature: {topFeature.method}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Used in {formatNumber(topFeature.orders)} orders (
              {formatPercent(topFeature.orderShare, 0)} of all orders) this
              period.
            </p>
          </div>
        </div>
      )}

      {/* Payment feature mix - stacked bar */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Payment feature mix
        </p>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
          {paymentMix.map((p, i) => (
            <div
              key={p.method}
              style={{
                width: `${p.orderShare}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
              title={`${p.method}: ${formatPercent(p.orderShare, 1)}`}
            />
          ))}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Feature</th>
                <th className="pb-2 text-right font-medium">Orders</th>
                <th className="pb-2 text-right font-medium">Share</th>
                <th className="pb-2 text-right font-medium">Revenue</th>
                <th className="pb-2 text-right font-medium">AOV</th>
              </tr>
            </thead>
            <tbody>
              {paymentMix.map((p, i) => (
                <tr key={p.method} className="border-t border-border">
                  <td className="py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      {p.method}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {formatNumber(p.orders)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {formatPercent(p.orderShare, 1)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {formatCompactCurrency(p.revenue, currency)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(p.aov, currency)}
                  </td>
                </tr>
              ))}
              {paymentMix.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No orders in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adoption rates */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Feature adoption
        </p>
        <div className="space-y-3">
          {adoption.map((a) => (
            <div key={a.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-foreground">{a.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(a.used)} / {formatNumber(a.total)} ·{" "}
                  <span className="font-medium text-foreground">
                    {formatPercent(a.rate, 1)}
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, a.rate)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount impact */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/40 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-600">
          <Tag className="h-4.5 w-4.5" />
        </span>
        <div className="flex-1 text-sm">
          <p className="font-medium text-foreground">Discounts & coupons</p>
          <p className="mt-0.5 text-muted-foreground">
            {formatNumber(discount.ordersWithCoupon)} orders used a coupon (
            {formatPercent(discount.couponRate, 1)}), giving{" "}
            {formatCurrency(discount.totalDiscount, currency)} in discounts
            {discount.ordersWithCoupon > 0 && (
              <> · {formatCurrency(discount.avgDiscount, currency)} avg</>
            )}
            .
          </p>
        </div>
      </div>
    </div>
  );
}
