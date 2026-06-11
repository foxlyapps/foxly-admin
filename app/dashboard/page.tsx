import { Download, Store, Power, ShoppingCart } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getResourceStats } from "@/lib/resources/stats";
import { getAnalytics } from "@/lib/analytics/queries";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Overview · Foxly Admin" };

export default async function DashboardPage() {
  const session = await verifySession();
  const [stats, analytics] = await Promise.all([
    getResourceStats(),
    getAnalytics("last_30_days"),
  ]);
  const { app } = analytics;

  const groups = stats.reduce<Record<string, typeof stats>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const highlights = [
    { label: "Active shops", value: app.activeShops, icon: Store, sub: `${app.totalShops} total` },
    { label: "Installs (30d)", value: app.installs, icon: Download, sub: `net ${app.netInstalls >= 0 ? "+" : ""}${app.netInstalls}` },
    { label: "Uninstalls (30d)", value: app.uninstalls, icon: Power, sub: `${app.churnRate.toFixed(1)}% churn` },
    { label: "Orders (30d)", value: analytics.kpi.orders, icon: ShoppingCart, sub: `${app.engagedShops} shops active` },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, {session.name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foxly Shopify app — internal overview of app health and managed data.
        </p>
      </div>

      {/* App health highlights */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {highlights.map((h) => (
          <div
            key={h.label}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {h.label}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                <h.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {h.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{h.sub}</p>
          </div>
        ))}
      </div>

      {Object.entries(groups).map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {group}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((s) => (
              <StatCard
                key={s.slug}
                slug={s.slug}
                label={s.label}
                count={s.count}
                icon={s.icon}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
