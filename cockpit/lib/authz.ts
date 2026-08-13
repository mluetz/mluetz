import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { PERMISSIONS, type PermissionKey } from "@/lib/authz-map";
import type { RoleKey } from "@/lib/domain/enums";

/**
 * Serverseitige Autorisierung (RBAC, Least Privilege).
 * Jede Server Action und jede geschützte Seite MUSS requireUser()/
 * requirePermission()/assertPermission() aufrufen – niemals nur auf
 * die Client-Navigation vertrauen.
 */

export { PERMISSIONS, type PermissionKey };

export function hasPermission(user: SessionUser, permission: PermissionKey): boolean {
  const allowed: readonly RoleKey[] = PERMISSIONS[permission];
  return user.roles.some((r) => allowed.includes(r));
}

/** Angemeldeten Benutzer erzwingen; sonst Redirect auf /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Benutzer + Berechtigung erzwingen; ohne Berechtigung Redirect auf /forbidden. */
export async function requirePermission(permission: PermissionKey): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) redirect("/forbidden");
  return user;
}

/** Für Server Actions: wirft statt zu redirecten (Fehler wird der UI gemeldet). */
export async function assertPermission(permission: PermissionKey): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Nicht angemeldet.");
  if (!hasPermission(user, permission)) throw new Error("Keine Berechtigung für diese Aktion.");
  return user;
}
