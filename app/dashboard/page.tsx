import { verifySession } from "@/lib/dal";
import { getResourceStats } from "@/lib/resources/stats";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Overview · Foxly Admin" };

export default async function DashboardPage() {
  const session = await verifySession();
  const stats = await getResourceStats();

  const groups = stats.reduce<Record<string, typeof stats>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, {session.name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is an overview of your data across all resources.
        </p>
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
