-- ============================================================
-- Update 0004 — Welle 1 (Review v3, B-2/B-4, P1-02/P1-05)
-- CIF-Register mit Bewertungsverfahren, Entfernung des Booleans
-- supportsCriticalFunction, Audit-Hash-Kette.
-- Für BESTEHENDE SQLite-Datenbanken (SQLite >= 3.35 wegen DROP COLUMN);
-- neue Installationen erhalten das Schema über `prisma db push`.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0004-welle1-cif-audit.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

-- 1) CriticalFunction erweitern -------------------------------------
ALTER TABLE "CriticalFunction" ADD COLUMN "cfId" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "businessArea" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "rtoHours" REAL;
ALTER TABLE "CriticalFunction" ADD COLUMN "rpoHours" REAL;
ALTER TABLE "CriticalFunction" ADD COLUMN "maxTolerableOutageHours" REAL;
ALTER TABLE "CriticalFunction" ADD COLUMN "impactTolerance" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "recoveryOrder" INTEGER;
ALTER TABLE "CriticalFunction" ADD COLUMN "reassessmentMonths" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "CriticalFunction" ADD COLUMN "nextAssessmentDate" DATETIME;

-- cfId-Backfill: CIF-01.. in stabiler Reihenfolge (rowid)
UPDATE "CriticalFunction"
SET "cfId" = 'CIF-' || printf('%02d', (
  SELECT COUNT(*) FROM "CriticalFunction" c2 WHERE c2.rowid <= "CriticalFunction".rowid
))
WHERE "cfId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "CriticalFunction_cfId_key" ON "CriticalFunction"("cfId");

-- 2) Bewertungsverfahren --------------------------------------------
CREATE TABLE IF NOT EXISTS "CifAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criticalFunctionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isCritical" BOOLEAN NOT NULL,
    "criteria" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "assessedById" TEXT,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CifAssessment_criticalFunctionId_fkey" FOREIGN KEY ("criticalFunctionId")
        REFERENCES "CriticalFunction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CifAssessment_assessedById_fkey" FOREIGN KEY ("assessedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CifAssessment_approvedById_fkey" FOREIGN KEY ("approvedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CifAssessment_criticalFunctionId_version_key"
    ON "CifAssessment"("criticalFunctionId", "version");

-- 3) Boolean-Migration (B-2): Flag -> Platzhalter-Verknüpfung ----------
-- Drittparteien mit gesetztem Flag, aber ohne Relationseintrag, werden mit
-- einer Platzhalter-CIF "Zu qualifizieren" verknüpft und sind damit als
-- Datenqualitätsbefund sichtbar, statt still ihre Einstufung zu verlieren.
INSERT INTO "CriticalFunction" ("id", "cfId", "name", "description", "isCritical", "reassessmentMonths")
SELECT 'cif_migr_placeholder', 'CIF-99', 'Zu qualifizieren (Migration)',
       'Platzhalter aus der Boolean-Migration (Update 0004): Drittparteien mit gesetztem supportsCriticalFunction, aber ohne konkrete CIF-Zuordnung. Fachlich nachqualifizieren und diese Verknüpfung ersetzen.',
       true, 12
WHERE EXISTS (
  SELECT 1 FROM "ThirdParty" tp
  WHERE tp."supportsCriticalFunction" = true
    AND NOT EXISTS (SELECT 1 FROM "_CriticalFunctionToThirdParty" j WHERE j."B" = tp."id")
)
AND NOT EXISTS (SELECT 1 FROM "CriticalFunction" WHERE "id" = 'cif_migr_placeholder');

INSERT INTO "_CriticalFunctionToThirdParty" ("A", "B")
SELECT 'cif_migr_placeholder', tp."id"
FROM "ThirdParty" tp
WHERE tp."supportsCriticalFunction" = true
  AND NOT EXISTS (SELECT 1 FROM "_CriticalFunctionToThirdParty" j WHERE j."B" = tp."id")
  AND EXISTS (SELECT 1 FROM "CriticalFunction" WHERE "id" = 'cif_migr_placeholder');

ALTER TABLE "ThirdParty" DROP COLUMN "supportsCriticalFunction";

-- 4) Audit-Hash-Kette (P1-05) ---------------------------------------
ALTER TABLE "AuditLog" ADD COLUMN "seq" INTEGER;
ALTER TABLE "AuditLog" ADD COLUMN "prevHash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "hash" TEXT;
-- Bestandseinträge: Sequenz nach Zeitstempel/rowid backfillen; hash bleibt
-- NULL ("legacy", vor Einführung der Verkettung — vom Integritätscheck
-- ausgewiesen, nicht als Bruch gewertet).
UPDATE "AuditLog"
SET "seq" = (SELECT COUNT(*) FROM "AuditLog" a2 WHERE a2.rowid <= "AuditLog".rowid)
WHERE "seq" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AuditLog_seq_key" ON "AuditLog"("seq");

COMMIT;
PRAGMA foreign_keys = ON;
