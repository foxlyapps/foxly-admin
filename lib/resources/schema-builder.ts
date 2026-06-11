import * as z from "zod";
import type { FieldMeta } from "./introspect";

/**
 * Build a Zod schema dynamically from introspected field metadata.
 * Used to validate create/update payloads for any resource.
 */
export function buildSchema(
  fields: FieldMeta[],
  mode: "create" | "update",
): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const f of fields) {
    if (!f.editable) continue;
    let schema = fieldSchema(f);

    // Optional when: has default, nullable, or during update (partial).
    const optional = !f.notNull || f.hasDefault || mode === "update";
    if (!f.notNull) schema = schema.nullable();
    if (optional) schema = schema.optional();

    shape[f.key] = schema;
  }

  return z.object(shape);
}

function fieldSchema(f: FieldMeta): z.ZodTypeAny {
  switch (f.kind) {
    case "boolean":
      return z.boolean();
    case "number":
      return z.coerce.number({ error: `${f.label} must be a number.` });
    case "enum":
      return z.enum(f.enumValues as [string, ...string[]]);
    case "json":
      return z.unknown();
    case "datetime":
    case "date":
      return z.string().min(1, { error: `${f.label} is required.` });
    default: {
      let s = z.string();
      if (f.notNull) s = s.min(1, { error: `${f.label} is required.` });
      return s;
    }
  }
}

/**
 * Coerce raw form values (all strings from FormData) into typed values
 * suitable for the schema + database.
 */
export function coerceFormData(
  fields: FieldMeta[],
  raw: Record<string, FormDataEntryValue | null>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!f.editable) continue;
    const value = raw[f.key];

    if (f.kind === "boolean") {
      out[f.key] = value === "on" || value === "true" || value === "1";
      continue;
    }

    // Empty string -> null (for nullable) or skip.
    if (value === null || value === "") {
      if (!f.notNull) out[f.key] = null;
      continue;
    }

    if (f.kind === "json") {
      try {
        out[f.key] = JSON.parse(String(value));
      } catch {
        out[f.key] = String(value);
      }
      continue;
    }

    out[f.key] = value;
  }
  return out;
}
