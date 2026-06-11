import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { verifySession } from "@/lib/dal";
import { resourcesForRole } from "./registry";
import { getTableName } from "drizzle-orm";

export interface ResourceStat {
  slug: string;
  label: string;
  group: string;
  icon: string;
  count: number;
}

/** Return row counts for every resource the current user can see. */
export async function getResourceStats(): Promise<ResourceStat[]> {
  const session = await verifySession();
  const resources = resourcesForRole(session.role);

  const stats = await Promise.all(
    resources.map(async (r) => {
      const tableName = getTableName(r.table);
      let count = 0;
      try {
        const result = await db.execute<{ n: number }>(
          sql.raw(`select count(*)::int as n from "${tableName}"`),
        );
        count = result.rows[0]?.n ?? 0;
      } catch {
        count = 0;
      }
      return {
        slug: r.slug,
        label: r.label,
        group: r.group,
        icon: r.icon.displayName ?? r.icon.name ?? "",
        count,
      };
    }),
  );

  return stats;
}
