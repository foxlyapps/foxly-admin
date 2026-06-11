import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload, type AdminRoleValue } from "./session";

/**
 * Verify the current admin session. Redirects to /login when absent.
 * Memoized per-request via React cache().
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

/** Returns the current session or null without redirecting. */
export const getCurrentSession = cache(async (): Promise<SessionPayload | null> => {
  return getSession();
});

/** Require a specific role; redirect to /dashboard if insufficient. */
export async function requireRole(role: AdminRoleValue): Promise<SessionPayload> {
  const session = await verifySession();
  if (role === "superadmin" && session.role !== "superadmin") {
    redirect("/dashboard");
  }
  return session;
}

export function isSuperAdmin(session: SessionPayload | null): boolean {
  return session?.role === "superadmin";
}
