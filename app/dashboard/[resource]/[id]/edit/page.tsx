import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getResource } from "@/lib/resources/registry";
import { introspectTable } from "@/lib/resources/introspect";
import { getRow } from "@/lib/resources/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceForm } from "@/components/dashboard/resource-form";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: slug, id } = await params;
  const session = await verifySession();
  const resource = getResource(slug);

  if (!resource || (resource.superAdminOnly && session.role !== "superadmin")) {
    notFound();
  }

  const { fields, primaryKey } = introspectTable(resource.table);
  const row = await getRow(slug, id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${resource.labelSingular}`}
        description={`Update this ${resource.labelSingular.toLowerCase()} record.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: resource.label, href: `/dashboard/${slug}` },
          { label: "Edit" },
        ]}
      />
      <Card>
        <CardContent>
          <ResourceForm
            slug={slug}
            labelSingular={resource.labelSingular}
            primaryKey={primaryKey}
            fields={fields}
            initialValues={row}
            id={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
