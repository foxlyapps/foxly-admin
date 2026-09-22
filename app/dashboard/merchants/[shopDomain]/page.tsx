import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { verifySession } from "@/lib/dal";
import {
  getMerchantHeader,
  getMerchantOrderStats,
  getMerchantJsonInsights,
  getMerchantOpsInsights,
  getMerchantFeatures,
  getMerchantUsageCycle,
  resolveMerchantRange,
} from "@/lib/merchants/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrdersRevenuePanel } from "@/components/merchants/orders-revenue-panel";
import { FeatureChecklist } from "@/components/merchants/feature-checklist";
import { UsageAutomationForm } from "@/components/merchants/usage-automation-form";

export const metadata = { title: "Merchant Details · Foxly Admin" };

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ shopDomain: string }>;
}) {
  await verifySession();
  const { shopDomain: encoded } = await params;
  const shopDomain = decodeURIComponent(encoded);

  const header = await getMerchantHeader(shopDomain);
  if (!header) notFound();

  const range = resolveMerchantRange("last_30_days");
  const rangeArg = { from: range.from.toISOString(), to: range.to.toISOString() };
  const [orderStats, insights, ops, features, usageCycle] = await Promise.all([
    getMerchantOrderStats(shopDomain, rangeArg),
    getMerchantJsonInsights(shopDomain, rangeArg),
    getMerchantOpsInsights(shopDomain, rangeArg),
    getMerchantFeatures(shopDomain),
    getMerchantUsageCycle(shopDomain),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={header.shopDomain}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Merchants", href: "/dashboard/merchants" },
          { label: header.shopDomain },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
          {header.uninstalledAt ? (
            <Badge tone="danger">Uninstalled</Badge>
          ) : (
            <Badge tone="success">Installed</Badge>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Store URL"
            value={
              <a
                href={`https://${header.shopDomain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                {header.shopDomain}
                <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
          <Field
            label="Current Plan"
            value={header.plan ? `${header.plan}${header.planStatus ? ` · ${header.planStatus}` : ""}` : "—"}
          />
          <Field
            label="Usage Start Date"
            value={header.usageStartDate ? new Date(header.usageStartDate).toLocaleDateString() : "—"}
          />
          <Field
            label="Usage End Date"
            value={header.usageEndDate ? new Date(header.usageEndDate).toLocaleDateString() : "—"}
          />
          <Field
            label="Installed"
            value={header.installedAt ? new Date(header.installedAt).toLocaleDateString() : "—"}
          />
          <Field
            label="Uninstalled"
            value={header.uninstalledAt ? new Date(header.uninstalledAt).toLocaleDateString() : "—"}
          />
          {usageCycle && (
            <Field
              label="Orders Used This Cycle"
              value={`${usageCycle.includedOrdersUsed} included${usageCycle.overageOrders > 0 ? ` + ${usageCycle.overageOrders} overage` : ""}`}
            />
          )}
        </CardContent>
      </Card>

      <OrdersRevenuePanel shopDomain={shopDomain} initial={orderStats} initialInsights={insights} initialOps={ops} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enabled Features</CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureChecklist features={features} />
          </CardContent>
        </Card>

        <UsageAutomationForm shopDomain={shopDomain} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
