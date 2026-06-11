import { getTableColumns, getTableName, type Table } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** UI input type derived from a database column. */
export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "json"
  | "date"
  | "datetime"
  | "enum"
  | "uuid";

export interface FieldMeta {
  /** Drizzle property key (camelCase). */
  key: string;
  /** Physical column name (snake_case). */
  column: string;
  label: string;
  kind: FieldKind;
  notNull: boolean;
  hasDefault: boolean;
  primary: boolean;
  enumValues?: readonly string[];
  /** Whether this field can be edited in forms. */
  editable: boolean;
  /** Whether to show this column in the list table by default. */
  inList: boolean;
}

import { humanizeKey } from "@/lib/utils";

function inferKind(col: PgColumn): FieldKind {
  const ct = (col as unknown as { columnType: string }).columnType;
  const enumValues = (col as unknown as { enumValues?: string[] }).enumValues;
  if (enumValues?.length) return "enum";
  switch (ct) {
    case "PgUUID":
      return "uuid";
    case "PgBoolean":
      return "boolean";
    case "PgInteger":
    case "PgBigInt53":
    case "PgBigInt64":
    case "PgBigSerial53":
    case "PgSerial":
    case "PgNumeric":
    case "PgDoublePrecision":
    case "PgReal":
      return "number";
    case "PgJsonb":
    case "PgJson":
      return "json";
    case "PgTimestamp":
    case "PgTimestampString":
      return "datetime";
    case "PgDate":
      return "date";
    case "PgText":
      return "text";
    default:
      return "text";
  }
}

/** Auto-generated, read-only system columns. */
const SYSTEM_KEYS = new Set(["id", "createdAt", "updatedAt"]);

/**
 * Introspect a Drizzle table into field metadata used to render
 * list tables and forms generically.
 */
export function introspectTable(table: Table): {
  name: string;
  primaryKey: string;
  fields: FieldMeta[];
} {
  const columns = getTableColumns(table);
  const fields: FieldMeta[] = [];
  let primaryKey = "id";

  for (const [key, col] of Object.entries(columns)) {
    const c = col as unknown as {
      name: string;
      notNull: boolean;
      hasDefault: boolean;
      primary: boolean;
      enumValues?: string[];
    };
    const kind = inferKind(col as PgColumn);
    if (c.primary) primaryKey = key;

    // Promote long-text-like columns to textarea by name heuristic.
    const longText = /token|description|notes|content|html|css|script|body|message|address/i;
    const finalKind =
      kind === "text" && longText.test(key) ? "textarea" : kind;

    const isSystem = SYSTEM_KEYS.has(key) || c.primary;

    fields.push({
      key,
      column: c.name,
      label: humanizeKey(key),
      kind: finalKind,
      notNull: c.notNull,
      hasDefault: c.hasDefault,
      primary: c.primary,
      enumValues: c.enumValues,
      editable: !isSystem,
      inList: true,
    });
  }

  return { name: getTableName(table), primaryKey, fields };
}
