"use server";

import { eq, sql, asc, desc, ilike, or, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { verifySession } from "@/lib/dal";
import { getResource } from "./registry";
import { introspectTable } from "./introspect";
import { buildSchema, coerceFormData } from "./schema-builder";

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

async function authorize(slug: string) {
  const session = await verifySession();
  const resource = getResource(slug);
  if (!resource) throw new Error(`Unknown resource: ${slug}`);
  if (resource.superAdminOnly && session.role !== "superadmin") {
    throw new Error("Forbidden");
  }
  return { session, resource };
}

/** Paginated, searchable list of rows for a resource. */
export async function listRows(slug: string, params: ListParams) {
  const { resource } = await authorize(slug);
  const { fields, primaryKey } = introspectTable(resource.table);
  const table = resource.table as unknown as Record<string, never>;

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  // Build search filter across text-like fields.
  let where: SQL | undefined;
  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    const conds = fields
      .filter((f) => ["text", "textarea", "uuid", "enum"].includes(f.kind))
      .map((f) => ilike(sql`${table[f.key]}::text`, term));
    if (conds.length) where = or(...conds);
  }

  // Sorting.
  const sortField =
    fields.find((f) => f.key === params.sortKey) ??
    fields.find((f) => f.key === primaryKey)!;
  const orderBy =
    params.sortDir === "asc"
      ? asc(table[sortField.key])
      : desc(table[sortField.key]);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(resource.table)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(resource.table)
      .where(where),
  ]);

  return {
    rows: rows as Record<string, unknown>[],
    total: count,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
  };
}

/** Fetch a single row by primary key. */
export async function getRow(slug: string, id: string) {
  const { resource } = await authorize(slug);
  const { primaryKey } = introspectTable(resource.table);
  const table = resource.table as unknown as Record<string, never>;
  const [row] = await db
    .select()
    .from(resource.table)
    .where(eq(table[primaryKey], castId(id)))
    .limit(1);
  return (row as Record<string, unknown>) ?? null;
}

export async function createRow(
  slug: string,
  raw: Record<string, FormDataEntryValue | null>,
): Promise<ActionResult> {
  const { resource } = await authorize(slug);
  if (resource.disableCreate) {
    return { ok: false, message: "Creating records is disabled for this resource." };
  }
  const { fields } = introspectTable(resource.table);
  const data = coerceFormData(fields, raw);

  // admin-users: the form sends a virtual `password`; hash it and satisfy passwordHash.
  if (slug === "admin-users") {
    const pw = raw.password ? String(raw.password) : "";
    if (pw.length < 8) {
      return { ok: false, errors: { password: ["Password must be at least 8 characters."] } };
    }
    data.passwordHash = await bcrypt.hash(pw, 12);
  }

  const parsed = buildSchema(fields, "create").safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: flatten(parsed.error) };
  }

  const values = parsed.data as Record<string, unknown>;

  try {
    await db.insert(resource.table).values(values as never);
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }

  revalidatePath(`/dashboard/${slug}`);
  return { ok: true, message: `${resource.labelSingular} created.` };
}

export async function updateRow(
  slug: string,
  id: string,
  raw: Record<string, FormDataEntryValue | null>,
): Promise<ActionResult> {
  const { resource } = await authorize(slug);
  const { fields, primaryKey } = introspectTable(resource.table);
  const table = resource.table as unknown as Record<string, never>;
  const data = coerceFormData(fields, raw);

  // admin-users: optionally update password via virtual field.
  if (slug === "admin-users") {
    const pw = raw.password ? String(raw.password) : "";
    if (pw) {
      if (pw.length < 8) {
        return { ok: false, errors: { password: ["Password must be at least 8 characters."] } };
      }
      data.passwordHash = await bcrypt.hash(pw, 12);
    }
  }

  const parsed = buildSchema(fields, "update").safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: flatten(parsed.error) };
  }

  const values = parsed.data as Record<string, unknown>;
  // Bump updatedAt when the column exists.
  if (fields.some((f) => f.key === "updatedAt")) {
    (values as Record<string, unknown>).updatedAt = new Date().toISOString();
  }

  try {
    await db
      .update(resource.table)
      .set(values as never)
      .where(eq(table[primaryKey], castId(id)));
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }

  revalidatePath(`/dashboard/${slug}`);
  return { ok: true, message: `${resource.labelSingular} updated.` };
}

export async function deleteRow(slug: string, id: string): Promise<ActionResult> {
  const { resource, session } = await authorize(slug);
  const { primaryKey } = introspectTable(resource.table);
  const table = resource.table as unknown as Record<string, never>;

  // Prevent deleting yourself from admin users.
  if (slug === "admin-users" && id === session.userId) {
    return { ok: false, message: "You cannot delete your own account." };
  }

  try {
    await db.delete(resource.table).where(eq(table[primaryKey], castId(id)));
  } catch (e) {
    return { ok: false, message: dbError(e) };
  }

  revalidatePath(`/dashboard/${slug}`);
  return { ok: true, message: `${resource.labelSingular} deleted.` };
}

/* ---------- helpers ---------- */

// bigserial PKs are numeric; everything else stays a string.
function castId(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id;
}

/** Map Zod issues to a field-keyed error object. */
function flatten(error: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function dbError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("duplicate key")) return "A record with these values already exists.";
  if (msg.includes("violates foreign key")) return "Referenced record does not exist.";
  if (msg.includes("violates not-null")) return "A required field is missing.";
  return "Database error. Please check your input and try again.";
}
