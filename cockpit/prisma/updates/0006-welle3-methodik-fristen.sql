-- ============================================================
-- Update 0006 — Welle 3 (Review v3, P1-04/P1-06/P1-07)
-- Methodikversionierung, Monatsabschluss-Snapshots, strukturierte
-- Vorfallsklassifizierung. Für BESTEHENDE SQLite-Datenbanken.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0006-welle3-methodik-fristen.sql
-- Danach einmalig eine aktive Methodikversion anlegen (Admin-UI:
-- Methodikänderung beantragen + durch zweite Person freigeben) —
-- neue Bewertungen referenzieren sie automatisch.
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

CREATE TABLE IF NOT EXISTS "MethodologyVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "lowMax" INTEGER NOT NULL,
    "mediumMax" INTEGER NOT NULL,
    "highMax" INTEGER NOT NULL,
    "mitigationCap" REAL NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requestedById" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    CONSTRAINT "MethodologyVersion_requestedById_fkey" FOREIGN KEY ("requestedById")
        REFERENCES "User" ("id") ON UPDATE CASCADE,
    CONSTRAINT "MethodologyVersion_approvedById_fkey" FOREIGN KEY ("approvedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MethodologyVersion_version_key" ON "MethodologyVersion"("version");

ALTER TABLE "RiskAssessment" ADD COLUMN "methodologyVersionId" TEXT
    REFERENCES "MethodologyVersion"("id");

CREATE TABLE IF NOT EXISTS "PeriodSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "doraIndexPercent" REAL,
    "openKnockouts" INTEGER NOT NULL,
    "kpis" TEXT NOT NULL,
    "riskList" TEXT NOT NULL,
    "registerRecordCount" INTEGER NOT NULL,
    "registerChecksum" TEXT NOT NULL,
    CONSTRAINT "PeriodSnapshot_createdById_fkey" FOREIGN KEY ("createdById")
        REFERENCES "User" ("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PeriodSnapshot_period_key" ON "PeriodSnapshot"("period");

CREATE TABLE IF NOT EXISTS "IncidentClassification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "isMajor" BOOLEAN NOT NULL,
    "aggregatedWith" TEXT,
    "voluntaryThreatNotice" BOOLEAN NOT NULL DEFAULT false,
    "classifiedById" TEXT NOT NULL,
    "classifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frozenAt" DATETIME,
    CONSTRAINT "IncidentClassification_incidentId_fkey" FOREIGN KEY ("incidentId")
        REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncidentClassification_classifiedById_fkey" FOREIGN KEY ("classifiedById")
        REFERENCES "User" ("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "IncidentClassification_incidentId_key"
    ON "IncidentClassification"("incidentId");

COMMIT;
PRAGMA foreign_keys = ON;
