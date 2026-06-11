import { verifySession } from "@/lib/dal";
import { getAnalytics } from "@/lib/analytics/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata = { title: "Analytics · Foxly Admin" };

export default async function AnalyticsPage() {
  await verifySession();
  const initial = await getAnalytics("last_30_days");

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Revenue, orders, and feature-usage insights across all stores."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />
      <AnalyticsDashboard initial={initial} />
    </div>
  );
}
