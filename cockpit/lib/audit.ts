import "server-only";
import { db } from "@/lib/db";

/**
 * Audit Trail: append-only. Es existieren bewusst KEINE Update-/Delete-
 * Funktionen für AuditLog-Einträge; die UI bietet nur Lesezugriff
 * (Berechtigung "audit:read").
 */

export interface AuditEntry {
  userId?: string | null;
  userEmail: string;
  action:
    | "LOGIN"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "CREATE"
    | "UPDATE"
    | "STATUS_CHANGE"
    | "ASSESS"
    | "APPROVE"
    | "REJECT"
    | "RETURN"
    | "ACCEPTANCE_REQUEST"
    | "ACCEPTANCE_DECISION"
    | "EXPORT"
    | "ROLE_CHANGE"
    | "SETTING_CHANGE"
    | "COMPLIANCE_CHANGE"
    | "EXECUTE"
    | "MFA_ENROLL"
    | "MFA_RESET";
  entityType: string;
  entityId: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  comment?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      userEmail: entry.userEmail,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      field: entry.field,
      oldValue: entry.oldValue ?? undefined,
      newValue: entry.newValue ?? undefined,
      comment: entry.comment,
    },
  });
}
