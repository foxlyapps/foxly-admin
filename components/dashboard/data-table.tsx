"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Inbox,
} from "lucide-react";
import type { FieldMeta } from "@/lib/resources/introspect";
import { listRows, deleteRow } from "@/lib/resources/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/stores/toast-store";
import { cn, formatCellValue } from "@/lib/utils";
import { RecordDrawer } from "./record-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DataTableProps {
  slug: string;
  labelSingular: string;
  primaryKey: string;
  fields: FieldMeta[];
  listColumns: FieldMeta[];
  canCreate: boolean;
  initial: {
    rows: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

type Row = Record<string, unknown>;

export function DataTable({
  slug,
  labelSingular,
  primaryKey,
  fields,
  listColumns,
  canCreate,
  initial,
}: DataTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>(primaryKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pending, startTransition] = useTransition();

  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(
    (next: { page?: number; search?: string; sortKey?: string; sortDir?: "asc" | "desc" }) => {
      startTransition(async () => {
        const result = await listRows(slug, {
          page: next.page ?? data.page,
          pageSize: data.pageSize,
          search: next.search ?? search,
          sortKey: next.sortKey ?? sortKey,
          sortDir: next.sortDir ?? sortDir,
        });
        setData(result);
      });
    },
    [slug, data.page, data.pageSize, search, sortKey, sortDir],
  );

  function handleSearch(value: string) {
    setSearch(value);
    refresh({ search: value, page: 1 });
  }

  function handleSort(key: string) {
    const dir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(dir);
    refresh({ sortKey: key, sortDir: dir, page: 1 });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const id = String(deleteTarget[primaryKey]);
    const res = await deleteRow(slug, id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      toast.success(res.message ?? "Deleted");
      refresh({});
    } else {
      toast.error(res.message ?? "Failed to delete");
    }
  }

  const start = (data.page - 1) * data.pageSize;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`Search ${labelSingular.toLowerCase()}…`}
            className="pl-9"
          />
        </div>
        {canCreate && (
          <Button onClick={() => router.push(`/dashboard/${slug}/new`)}>
            <Plus className="h-4 w-4" />
            New {labelSingular}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50">
                {listColumns.map((f) => (
                  <th
                    key={f.key}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    <button
                      onClick={() => handleSort(f.key)}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {f.label}
                      <SortIcon
                        active={sortKey === f.key}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                ))}
                <th className="w-32 px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={cn(pending && "opacity-50 transition-opacity")}>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={listColumns.length + 1}
                    className="px-4 py-16 text-center"
                  >
                    <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No records found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search
                        ? "Try adjusting your search."
                        : `Get started by creating a ${labelSingular.toLowerCase()}.`}
                    </p>
                  </td>
                </tr>
              ) : (
                data.rows.map((row, i) => (
                  <tr
                    key={String(row[primaryKey] ?? i)}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface-muted/40"
                  >
                    {listColumns.map((f) => (
                      <td key={f.key} className="px-4 py-3 text-foreground">
                        <Cell field={f} value={row[f.key]} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn
                          label="View"
                          onClick={() => setViewRow(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          label="Edit"
                          onClick={() =>
                            router.push(
                              `/dashboard/${slug}/${row[primaryKey]}/edit`,
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          label="Delete"
                          danger
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {data.total === 0
              ? "No results"
              : `Showing ${start + 1}–${Math.min(start + data.pageSize, data.total)} of ${data.total.toLocaleString()}`}
          </p>
          <div className="flex items-center gap-2">
            {pending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || pending}
              onClick={() => refresh({ page: data.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              Page {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || pending}
              onClick={() => refresh({ page: data.page + 1 })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewRow && (
        <RecordDrawer
          fields={fields}
          row={viewRow}
          title={labelSingular}
          onClose={() => setViewRow(null)}
          onEdit={() =>
            router.push(`/dashboard/${slug}/${viewRow[primaryKey]}/edit`)
          }
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${labelSingular}?`}
          description="This action cannot be undone. The record will be permanently removed."
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

function IconBtn({
  children,
  label,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        danger
          ? "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          : "hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Cell({ field, value }: { field: FieldMeta; value: unknown }) {
  if (field.kind === "boolean") {
    return (
      <Badge tone={value ? "success" : "neutral"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (field.kind === "enum" && value != null) {
    return <Badge tone="brand">{String(value)}</Badge>;
  }
  const text = formatCellValue(value);
  return (
    <span
      className={cn(
        "block max-w-[28ch] truncate",
        value == null && "text-muted-foreground",
        field.kind === "uuid" && "font-mono text-xs text-muted-foreground",
      )}
      title={text}
    >
      {text}
    </span>
  );
}
