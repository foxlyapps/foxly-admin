"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Loader2, Inbox, ExternalLink, IndianRupee } from "lucide-react";
import type { RangePreset } from "@/lib/analytics/ranges";
import type { MerchantListRow, InstalledFilter } from "@/lib/merchants/queries";
import { fetchMerchants } from "@/lib/merchants/actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RangeFilter } from "@/components/analytics/range-filter";
import { formatCompactCurrency, formatIndianWords, formatNumber } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

interface MerchantTableProps {
  initial: {
    rows: MerchantListRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  plans: string[];
}

export function MerchantTable({ initial, plans }: MerchantTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState<RangePreset | undefined>(undefined);
  const [plan, setPlan] = useState("");
  const [installed, setInstalled] = useState<InstalledFilter>("installed");
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(
    (next: {
      page?: number;
      search?: string;
      preset?: RangePreset | undefined;
      plan?: string;
      installed?: InstalledFilter;
    }) => {
      startTransition(async () => {
        const result = await fetchMerchants(
          {
            search: next.search ?? search,
            preset: "preset" in next ? next.preset : preset,
            plan: (next.plan ?? plan) || undefined,
            installed: next.installed ?? installed,
          },
          next.page ?? 1,
        );
        setData(result);
      });
    },
    [search, preset, plan, installed],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-sm md:flex-row md:flex-wrap md:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search store domain…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              refresh({ search: e.target.value, page: 1 });
            }}
          />
        </div>

        <RangeFilter
          value={preset ?? "all_time"}
          onChange={(p) => {
            const next = p === "all_time" ? undefined : p;
            setPreset(next);
            refresh({ preset: next, page: 1 });
          }}
        />

        <Select
          className="w-auto min-w-[140px]"
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            refresh({ plan: e.target.value, page: 1 });
          }}
        >
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>

        <Select
          className="w-auto min-w-[140px]"
          value={installed}
          onChange={(e) => {
            const v = e.target.value as InstalledFilter;
            setInstalled(v);
            refresh({ installed: v, page: 1 });
          }}
        >
          <option value="all">All stores</option>
          <option value="installed">Installed</option>
          <option value="uninstalled">Uninstalled</option>
        </Select>
      </div>

      <div className={cn("rounded-[var(--radius-card)] border border-border bg-surface shadow-sm", pending && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Revenue
                  </span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 && !pending && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-6 w-6" />
                    No merchants match these filters.
                  </td>
                </tr>
              )}
              {data.rows.map((row) => (
                <tr
                  key={row.shopDomain}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                  onClick={() => router.push(`/dashboard/merchants/${row.shopDomain}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{row.domain ?? row.shopDomain}</p>
                  </td>
                  <td className="px-4 py-3">
                    {row.plan ? <Badge tone="brand">{row.plan}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.uninstalledAt ? (
                      <Badge tone="danger">Uninstalled</Badge>
                    ) : (
                      <Badge tone="success">Installed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(row.orders)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span title={formatIndianWords(row.revenue)} className="cursor-default">
                      {formatCompactCurrency(row.revenue, "INR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/merchants/${row.shopDomain}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.total)} merchant{data.total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin text-brand-600" />}
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || pending}
              onClick={() => refresh({ page: data.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || pending}
              onClick={() => refresh({ page: data.page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
