import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getResource } from "@/lib/resources/registry";
import { introspectTable } from "@/lib/resources/introspect";
import { listRows } from "@/lib/resources/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";

export default async function ResourceListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;
  const session = await verifySession();
  const resource = getResource(slug);

  if (!resource || (resource.superAdminOnly && session.role !== "superadmin")) {
    notFound();
  }

  const { fields, primaryKey } = introspectTable(resource.table);

  // Choose list columns: configured primary columns, else first few non-system.
  const listColumns = pickListColumns(fields, resource.primaryColumns);

  const initial = await listRows(slug, {
    page: 1,
    pageSize: 20,
    sortKey: primaryKey,
    sortDir: "desc",
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={resource.label}
        description={resource.description}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: resource.label },
        ]}
      />
      <DataTable
        slug={slug}
        labelSingular={resource.labelSingular}
        primaryKey={primaryKey}
        fields={fields}
        listColumns={listColumns}
        canCreate={!resource.disableCreate}
        initial={initial}
      />
    </div>
  );
}

function pickListColumns(
  fields: ReturnType<typeof introspectTable>["fields"],
  preferred: string[],
) {
  if (preferred.length) {
    const map = new Map(fields.map((f) => [f.key, f]));
    const cols = preferred.map((k) => map.get(k)).filter(Boolean) as typeof fields;
    if (cols.length) return cols.slice(0, 6);
  }
  // Fallback: first 5 non-json columns.
  return fields.filter((f) => f.kind !== "json").slice(0, 5);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  const r = getResource(resource);
  return { title: `${r?.label ?? "Resource"} · Foxly Admin` };
}
