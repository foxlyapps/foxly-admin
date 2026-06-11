"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import type { FieldMeta } from "@/lib/resources/introspect";
import { createRow, updateRow } from "@/lib/resources/actions";
import {
  Input,
  Textarea,
  Select,
  Label,
  FieldError,
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/stores/toast-store";
import { cn, humanizeKey } from "@/lib/utils";

interface ResourceFormProps {
  slug: string;
  labelSingular: string;
  primaryKey: string;
  fields: FieldMeta[];
  /** Existing values for edit; undefined for create. */
  initialValues?: Record<string, unknown>;
  id?: string;
}

export function ResourceForm({
  slug,
  labelSingular,
  fields,
  initialValues,
  id,
}: ResourceFormProps) {
  const router = useRouter();
  const isEdit = Boolean(id);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const editableFields = buildFormFields(fields, slug, isEdit);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, FormDataEntryValue | null> = {};
    for (const f of editableFields) {
      raw[f.key] =
        f.kind === "boolean"
          ? formData.get(f.key)
            ? "on"
            : ""
          : formData.get(f.key);
    }

    const res = isEdit
      ? await updateRow(slug, id!, raw)
      : await createRow(slug, raw);

    setSubmitting(false);

    if (res.ok) {
      toast.success(res.message ?? "Saved");
      router.push(`/dashboard/${slug}`);
      router.refresh();
    } else if (res.errors) {
      setErrors(res.errors);
      toast.error("Please fix the highlighted fields.");
    } else {
      toast.error(res.message ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {editableFields.map((f) => {
          const wide = f.kind === "json" || f.kind === "textarea";
          return (
            <div key={f.key} className={cn(wide && "md:col-span-2")}>
              <Label htmlFor={f.key}>
                {f.label}
                {f.notNull && !f.virtual && (
                  <span className="ml-0.5 text-red-500">*</span>
                )}
              </Label>
              <FieldInput
                field={f}
                defaultValue={initialValues?.[f.key]}
                invalid={!!errors[f.key]}
              />
              <FieldError messages={errors[f.key]} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/${slug}`)}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Save changes" : `Create ${labelSingular}`}
        </Button>
      </div>
    </form>
  );
}

interface FormField extends FieldMeta {
  virtual?: boolean;
  inputType?: string;
}

/** Compute the editable form fields, injecting virtual fields (e.g. password). */
function buildFormFields(
  fields: FieldMeta[],
  slug: string,
  isEdit: boolean,
): FormField[] {
  const editable: FormField[] = fields
    .filter((f) => f.editable && !(slug === "admin-users" && f.key === "passwordHash"))
    .map((f) => ({ ...f }));

  if (slug === "admin-users") {
    // Insert a virtual password field (hashed server-side).
    editable.push({
      key: "password",
      column: "password",
      label: isEdit ? "New Password (leave blank to keep)" : "Password",
      kind: "text",
      notNull: !isEdit,
      hasDefault: false,
      primary: false,
      editable: true,
      inList: false,
      virtual: true,
      inputType: "password",
    });
  }

  return editable;
}

function FieldInput({
  field,
  defaultValue,
  invalid,
}: {
  field: FormField;
  defaultValue?: unknown;
  invalid: boolean;
}) {
  const common = {
    id: field.key,
    name: field.key,
    "aria-invalid": invalid,
  };

  if (field.kind === "boolean") {
    return (
      <label className="mt-1 inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          id={field.key}
          name={field.key}
          defaultChecked={Boolean(defaultValue)}
          className="h-5 w-5 rounded border-border-strong text-brand-600 focus:ring-2 focus:ring-ring/40"
        />
        <span className="text-sm text-muted-foreground">Enabled</span>
      </label>
    );
  }

  if (field.kind === "enum") {
    return (
      <Select {...common} defaultValue={defaultValue as string | undefined}>
        {!field.notNull && <option value="">—</option>}
        {field.enumValues?.map((v) => (
          <option key={v} value={v}>
            {humanizeKey(v)}
          </option>
        ))}
      </Select>
    );
  }

  if (field.kind === "json") {
    return (
      <Textarea
        {...common}
        rows={6}
        defaultValue={
          defaultValue != null
            ? typeof defaultValue === "string"
              ? defaultValue
              : JSON.stringify(defaultValue, null, 2)
            : ""
        }
        placeholder="{ }"
      />
    );
  }

  if (field.kind === "textarea") {
    return (
      <Textarea
        {...common}
        rows={3}
        defaultValue={(defaultValue as string) ?? ""}
        className="font-sans"
      />
    );
  }

  const type =
    field.inputType ??
    (field.kind === "number"
      ? "number"
      : field.kind === "datetime"
        ? "datetime-local"
        : field.kind === "date"
          ? "date"
          : "text");

  return (
    <Input
      {...common}
      type={type}
      step={field.kind === "number" ? "any" : undefined}
      defaultValue={formatDefault(field, defaultValue)}
      placeholder={field.kind === "uuid" ? "Auto-generated if blank" : undefined}
    />
  );
}

function formatDefault(field: FormField, value: unknown): string {
  if (value == null) return "";
  if (field.kind === "datetime" && typeof value === "string") {
    // Convert ISO -> input-local format (yyyy-MM-ddThh:mm).
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return String(value);
}
