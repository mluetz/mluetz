-- ============================================================
-- Update 0007 — Wellen 5/6 (Review v3, P2-05/P2-07/P2-10)
-- Resilienz-Testprogramm, Threat-Intelligence-Register,
-- Berichtspflichten-Kalender. Für BESTEHENDE SQLite-Datenbanken.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0007-welle5-6-tests-ti-sod.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

CREATE TABLE IF NOT EXISTS "ResilienceTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "plannedFor" DATETIME NOT NULL,
    "performedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "result" TEXT,
    "tester" TEXT,
    "testerExternal" BOOLEAN NOT NULL DEFAULT false,
    "includesProviders" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ResilienceTest_testId_key" ON "ResilienceTest"("testId");

CREATE TABLE IF NOT EXISTS "_CriticalFunctionToResilienceTest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CriticalFunctionToResilienceTest_A_fkey" FOREIGN KEY ("A")
        REFERENCES "CriticalFunction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CriticalFunctionToResilienceTest_B_fkey" FOREIGN KEY ("B")
        REFERENCES "ResilienceTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_CriticalFunctionToResilienceTest_AB_unique"
    ON "_CriticalFunctionToResilienceTest"("A", "B");
CREATE INDEX IF NOT EXISTS "_CriticalFunctionToResilienceTest_B_index"
    ON "_CriticalFunctionToResilienceTest"("B");

CREATE TABLE IF NOT EXISTS "ThreatIntelAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "assessedAt" DATETIME,
    "relevance" TEXT,
    "assessment" TEXT,
    "linkedRiskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "GovernanceReportDuty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "addressee" TEXT NOT NULL,
    "nextDueAt" DATETIME,
    "lastPresentedAt" DATETIME,
    "presentationEvidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN'
);

COMMIT;
PRAGMA foreign_keys = ON;
