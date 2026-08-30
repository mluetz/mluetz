import "server-only";
import { db } from "@/lib/db";
import { auditHash, canonicalAuditString } from "@/lib/audit-hash";

export { auditHash, canonicalAuditString };

/**
 * Audit Trail: append-only. Es existieren bewusst KEINE Update-/Delete-
 * Funktionen für AuditLog-Einträge; die UI bietet nur Lesezugriff
 * (Berechtigung "audit:read").
 *
 * Manipulationsschutz (Review v3, P1-05): Jeder Eintrag trägt eine
 * fortlaufende Kettenposition (seq) und einen SHA-256-Hash über den
 * Vorgänger-Hash plus die kanonischen Feldwerte. Nachträgliche Änderung
 * oder Löschung eines Eintrags bricht die Kette und wird vom
 * Integritätscheck (lib/audit-integrity.ts, RB-Job) erkannt.
 *
 * Aufbewahrung: AUDIT_RETENTION_DAYS (Default 3650 = 10 Jahre); der
 * Integritäts-Job meldet Einträge jenseits der Frist, löscht aber nie
 * automatisch — Löschung ist eine dokumentierte Betriebsentscheidung.
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
  await db.$transaction(async (tx) => {
    const last = await tx.auditLog.findFirst({
      orderBy: { seq: "desc" },
      select: { hash: true, seq: true },
    });
    const created = await tx.auditLog.create({
      data: {
        seq: (last?.seq ?? 0) + 1,
        userId: entry.userId ?? null,
        userEmail: entry.userEmail,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        field: entry.field,
        oldValue: entry.oldValue ?? undefined,
        newValue: entry.newValue ?? undefined,
        comment: entry.comment,
        prevHash: last?.hash ?? null,
      },
    });
    const hash = auditHash(
      canonicalAuditString({
        seq: created.seq,
        timestamp: created.timestamp,
        userId: created.userId,
        userEmail: created.userEmail,
        action: created.action,
        entityType: created.entityType,
        entityId: created.entityId,
        field: created.field,
        oldValue: created.oldValue,
        newValue: created.newValue,
        comment: created.comment,
        prevHash: created.prevHash,
      }),
    );
    await tx.auditLog.update({ where: { id: created.id }, data: { hash } });
  });
}
