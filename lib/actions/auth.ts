"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/admin";
import { createSession, deleteSession } from "@/lib/session";
import { LoginSchema, type LoginState } from "@/lib/validations/auth";

/** Authenticate an admin user and create a session. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z_flatten(parsed.error) };
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  // Use a constant message to avoid leaking which field was wrong.
  const invalid: LoginState = { message: "Invalid email or password." };

  if (!user || !user.isActive) {
    // Still run a hash to mitigate timing attacks when user is absent.
    if (!user) await bcrypt.compare(password, "$2b$10$invalidinvalidinvalidinvalidinvalidinv");
    return user && !user.isActive
      ? { message: "This account has been deactivated." }
      : invalid;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return invalid;

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(adminUsers.id, user.id));

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}

/** Log the current admin out. */
export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

// Small helper to normalise Zod error -> field error map.
function z_flatten(error: import("zod").ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors as { email?: string[]; password?: string[] };
}
