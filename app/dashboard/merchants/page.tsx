import { verifySession } from "@/lib/dal";
import { listMerchants, getDistinctPlans } from "@/lib/merchants/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { MerchantTable } from "@/components/merchants/merchant-table";

export const metadata = { title: "Merchants · Foxly Admin" };

export default async function MerchantsPage() {
  await verifySession();

  const [initial, plans] = await Promise.all([
    listMerchants({ installed: "installed" }, 1),
    getDistinctPlans(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Merchants"
        description="Every store that has installed the app, with plan and install status."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Merchants" }]}
      />
      <MerchantTable initial={initial} plans={plans} />
    </div>
  );
}
