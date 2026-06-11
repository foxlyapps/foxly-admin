"use client";

import { X, Pencil } from "lucide-react";
import type { FieldMeta } from "@/lib/resources/introspect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCellValue } from "@/lib/utils";

interface RecordDrawerProps {
  fields: FieldMeta[];
  row: Record<string, unknown>;
  title: string;
  onClose: () => void;
  onEdit: () => void;
}

export function RecordDrawer({
  fields,
  row,
  title,
  onClose,
  onEdit,
}: RecordDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-fade-in relative flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">
            {title} details
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <dl className="space-y-4">
            {fields.map((f) => (
              <div
                key={f.key}
                className="grid grid-cols-3 gap-3 border-b border-border pb-4 last:border-0"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="col-span-2 min-w-0 text-sm text-foreground">
                  <Value field={f} value={row[f.key]} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Value({ field, value }: { field: FieldMeta; value: unknown }) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (field.kind === "boolean") {
    return (
      <Badge tone={value ? "success" : "neutral"}>{value ? "Yes" : "No"}</Badge>
    );
  }
  if (field.kind === "enum") {
    return <Badge tone="brand">{String(value)}</Badge>;
  }
  if (field.kind === "json") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-surface-muted p-3 font-mono text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return (
    <span className={field.kind === "uuid" ? "font-mono text-xs break-all" : "break-words"}>
      {formatCellValue(value)}
    </span>
  );
}
