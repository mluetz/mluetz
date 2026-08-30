import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { auditHash, canonicalAuditString } from "@/lib/audit-hash";

/**
 * Integritätsprüfung der Audit-Kette (Review v3, P1-05):
 * - Lücken in der Sequenz (gelöschte Einträge)
 * - Hash-Brüche (nachträglich geänderte Einträge)
 * - Kettenbrüche (prevHash passt nicht zum Vorgänger)
 * Einträge aus der Zeit VOR Einführung der Verkettung (hash = null und
 * prevHash = null am Kettenanfang) werden als "legacy" ausgewiesen.
 *
 * Signierter Export: HMAC-SHA256 über das Ergebnis mit SESSION_SECRET —
 * belegt gegenüber Prüfern, dass der Auszug unverändert aus dem System kommt.
 */

export interface AuditIntegrityResult {
  checkedAt: string;
  totalEntries: number;
  legacyEntries: number;
  gaps: number[];
  brokenHashes: number[];
  brokenChain: number[];
  retentionDays: number;
  entriesBeyondRetention: number;
  ok: boolean;
}

export async function verifyAuditChain(): Promise<AuditIntegrityResult> {
  const entries = await db.auditLog.findMany({ orderBy: { seq: "asc" } });
  const gaps: number[] = [];
  const brokenHashes: number[] = [];
  const brokenChain: number[] = [];
  let legacy = 0;
  let prevSeq: number | null = null;
  let prevHash: string | null = null;
  let chainStarted = false;

  for (const e of entries) {
    if (prevSeq !== null && e.seq !== prevSeq + 1) gaps.push(e.seq);
    prevSeq = e.seq;

    if (e.hash === null) {
      // Legacy-Eintrag vor Einführung der Verkettung.
      legacy += 1;
      prevHash = null;
      continue;
    }
    const expected = auditHash(
      canonicalAuditString({
        seq: e.seq,
        timestamp: e.timestamp,
        userId: e.userId,
        userEmail: e.userEmail,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
        comment: e.comment,
        prevHash: e.prevHash,
      }),
    );
    if (expected !== e.hash) brokenHashes.push(e.seq);
    if (chainStarted && e.prevHash !== prevHash) brokenChain.push(e.seq);
    prevHash = e.hash;
    chainStarted = true;
  }

  const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS ?? 3650);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const entriesBeyondRetention = await db.auditLog.count({
    where: { timestamp: { lt: cutoff } },
  });

  return {
    checkedAt: new Date().toISOString(),
    totalEntries: entries.length,
    legacyEntries: legacy,
    gaps,
    brokenHashes,
    brokenChain,
    retentionDays,
    entriesBeyondRetention,
    ok: gaps.length === 0 && brokenHashes.length === 0 && brokenChain.length === 0,
  };
}

/** Signatur für Prüfer-Exporte (HMAC über den kanonischen Ergebnis-JSON). */
export function signIntegrityResult(result: AuditIntegrityResult): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", secret).update(JSON.stringify(result)).digest("hex");
}
