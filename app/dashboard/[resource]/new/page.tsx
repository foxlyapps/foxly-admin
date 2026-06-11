import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getResource } from "@/lib/resources/registry";
import { introspectTable } from "@/lib/resources/introspect";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceForm } from "@/components/dashboard/resource-form";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;
  const session = await verifySession();
  const resource = getResource(slug);

  if (
    !resource ||
    resource.disableCreate ||
    (resource.superAdminOnly && session.role !== "superadmin")
  ) {
    notFound();
  }

  const { fields, primaryKey } = introspectTable(resource.table);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`New ${resource.labelSingular}`}
        description={`Create a new ${resource.labelSingular.toLowerCase()} record.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: resource.label, href: `/dashboard/${slug}` },
          { label: "New" },
        ]}
      />
      <Card>
        <CardContent>
          <ResourceForm
            slug={slug}
            labelSingular={resource.labelSingular}
            primaryKey={primaryKey}
            fields={fields}
          />
        </CardContent>
      </Card>
    </div>
  );
}
