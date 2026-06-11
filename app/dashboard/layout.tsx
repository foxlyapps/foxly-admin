import { verifySession } from "@/lib/dal";
import { resourcesForRole } from "@/lib/resources/registry";
import { DashboardShell } from "@/components/dashboard/shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  const resources = resourcesForRole(session.role);

  const items: NavItem[] = resources.map((r) => ({
    slug: r.slug,
    label: r.label,
    group: r.group,
    icon: r.icon.displayName ?? r.icon.name ?? "",
  }));

  return (
    <DashboardShell
      items={items}
      user={{ name: session.name, email: session.email, role: session.role }}
    >
      {children}
    </DashboardShell>
  );
}
