import { createHash } from "node:crypto";

/**
 * Reine Hash-Funktionen der Audit-Kette (ohne "server-only", damit sie
 * isoliert testbar sind — verwendet werden sie ausschließlich serverseitig
 * über lib/audit.ts und lib/audit-integrity.ts).
 */

export interface CanonicalAuditEntry {
  seq: number;
  timestamp: Date;
  userId: string | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  comment: string | null;
  prevHash: string | null;
}

/** Kanonische, versionsstabile Serialisierung eines Eintrags für den Hash. */
export function canonicalAuditString(e: CanonicalAuditEntry): string {
  return JSON.stringify([
    e.seq,
    e.timestamp.toISOString(),
    e.userId,
    e.userEmail,
    e.action,
    e.entityType,
    e.entityId,
    e.field,
    e.oldValue,
    e.newValue,
    e.comment,
    e.prevHash,
  ]);
}

export function auditHash(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
